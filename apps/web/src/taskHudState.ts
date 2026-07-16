import { scopedThreadKey } from "@v12/client-runtime/environment";
import type { MessageId, ScopedThreadRef, ThreadId } from "@v12/contracts";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "./lib/storage";
import type { ActivePlanState } from "./session-logic";

const TASK_HUD_STORAGE_KEY = "v12:task-hud-state:v1";
const MAX_PERSISTED_PLAN_OVERRIDES = 100;
const MAX_PERSISTED_CONTEXT_TASKS = 200;
const TRAILING_TASK_ANNOTATIONS_PATTERN =
  /\n*<task_annotations count="(\d+)">\n[\s\S]*\n<\/task_annotations>\s*$/;

export type TaskHudSourceStep = ActivePlanState["steps"][number];

export interface TaskHudStep extends TaskHudSourceStep {
  readonly id: string;
}

export interface TaskHudPlanOverrides {
  readonly order: readonly string[];
  readonly removed: readonly string[];
  readonly completedByTaskId: Readonly<Record<string, boolean>>;
}

export interface ContextualTask {
  readonly id: string;
  readonly instruction: string;
  readonly quote: string;
  readonly sourceThreadId: ThreadId;
  readonly sourceMessageId: MessageId;
  readonly sourceAuthor: "user" | "assistant";
  readonly sourceCreatedAt: string;
  readonly completed: boolean;
  readonly pendingSend?: boolean;
}

export function filterPendingContextTasks(
  tasks: readonly ContextualTask[],
): readonly ContextualTask[] {
  return tasks.filter((task) => task.pendingSend === true);
}

const EMPTY_OVERRIDES: TaskHudPlanOverrides = Object.freeze({
  order: Object.freeze([]),
  removed: Object.freeze([]),
  completedByTaskId: Object.freeze({}),
});

interface TaskHudStoreState {
  readonly overridesByPlanKey: Record<string, TaskHudPlanOverrides>;
  readonly contextTasksByThreadKey: Record<string, readonly ContextualTask[]>;
  readonly setTaskCompleted: (planKey: string, taskId: string, completed: boolean) => void;
  readonly removeTask: (planKey: string, taskId: string) => void;
  readonly setTaskOrder: (planKey: string, taskIds: readonly string[]) => void;
  readonly addContextTask: (threadKey: string, task: ContextualTask) => void;
  readonly setContextTaskCompleted: (threadKey: string, taskId: string, completed: boolean) => void;
  readonly removeContextTask: (threadKey: string, taskId: string) => void;
  readonly consumeContextTasks: (threadKey: string, taskIds: readonly string[]) => void;
  readonly copyContextTasksToFork: (input: {
    readonly sourceThreadKey: string;
    readonly targetThreadKey: string;
    readonly sourceThreadId: ThreadId;
    readonly targetThreadId: ThreadId;
    readonly messageIdBySourceId: Readonly<Record<string, MessageId>>;
  }) => void;
}

export function buildForkMessageIdMap(
  sourceMessages: ReadonlyArray<Pick<{ id: MessageId }, "id">>,
  targetMessages: ReadonlyArray<Pick<{ id: MessageId }, "id">>,
): Readonly<Record<string, MessageId>> {
  if (sourceMessages.length !== targetMessages.length) {
    throw new Error(
      `Fork history is incomplete: expected ${sourceMessages.length} messages, received ${targetMessages.length}.`,
    );
  }
  const messageIdBySourceId: Record<string, MessageId> = {};
  for (let index = 0; index < sourceMessages.length; index += 1) {
    const sourceMessage = sourceMessages[index];
    const targetMessage = targetMessages[index];
    if (sourceMessage && targetMessage) {
      messageIdBySourceId[sourceMessage.id] = targetMessage.id;
    }
  }
  return messageIdBySourceId;
}

export function taskHudPlanKey(
  threadRef: ScopedThreadRef,
  plan: Pick<ActivePlanState, "turnId" | "createdAt">,
): string {
  return `${scopedThreadKey(threadRef)}:${plan.turnId ?? plan.createdAt}`;
}

export function appendContextTasksToPrompt(
  prompt: string,
  tasks: readonly Pick<ContextualTask, "instruction" | "quote">[],
): string {
  if (tasks.length === 0) return prompt;
  const taskLines = tasks.map((task, index) => {
    const selectedContext =
      task.quote === task.instruction
        ? ""
        : `\n   Selected text: ${task.quote.replaceAll("\n", "\n   ")}`;
    return `${index + 1}. ${task.instruction}${selectedContext}`;
  });
  const taskBlock = tasks.length === 1 ? taskLines[0]! : `Tasks:\n${taskLines.join("\n")}`;
  const annotations = `<task_annotations count="${tasks.length}">\n${taskBlock}\n</task_annotations>`;
  const trimmedPrompt = prompt.trim();
  return trimmedPrompt ? `${trimmedPrompt}\n\n${annotations}` : annotations;
}

export function extractTrailingTaskAnnotations(prompt: string): {
  readonly promptText: string;
  readonly annotationCount: number;
} {
  const match = TRAILING_TASK_ANNOTATIONS_PATTERN.exec(prompt);
  if (!match) return { promptText: prompt, annotationCount: 0 };
  const parsedCount = Number.parseInt(match[1] ?? "", 10);
  return {
    promptText: prompt.slice(0, match.index).replace(/\n+$/, ""),
    annotationCount: Number.isSafeInteger(parsedCount) && parsedCount > 0 ? parsedCount : 0,
  };
}

export function identifyTaskHudSteps(steps: readonly TaskHudSourceStep[]): TaskHudStep[] {
  const occurrenceByText = new Map<string, number>();
  return steps.map((step) => {
    const occurrence = occurrenceByText.get(step.step) ?? 0;
    occurrenceByText.set(step.step, occurrence + 1);
    return {
      ...step,
      id: `${step.step}\u0000${occurrence}`,
    };
  });
}

export function applyTaskHudOverrides(
  steps: readonly TaskHudSourceStep[],
  overrides: TaskHudPlanOverrides | undefined,
): TaskHudStep[] {
  const identified = identifyTaskHudSteps(steps);
  if (!overrides) return identified;

  const removed = new Set(overrides.removed);
  const availableById = new Map(
    identified.filter((step) => !removed.has(step.id)).map((step) => [step.id, step] as const),
  );
  const orderedIds = [
    ...overrides.order.filter((taskId) => availableById.has(taskId)),
    ...identified.map((step) => step.id).filter((taskId) => availableById.has(taskId)),
  ];
  const emitted = new Set<string>();

  return orderedIds.flatMap((taskId) => {
    if (emitted.has(taskId)) return [];
    const step = availableById.get(taskId);
    if (!step) return [];
    emitted.add(taskId);
    const completedOverride = overrides.completedByTaskId[taskId];
    return [
      completedOverride === undefined
        ? step
        : { ...step, status: completedOverride ? ("completed" as const) : ("pending" as const) },
    ];
  });
}

function updateOverrides(
  state: TaskHudStoreState,
  planKey: string,
  update: (current: TaskHudPlanOverrides) => TaskHudPlanOverrides,
): Pick<TaskHudStoreState, "overridesByPlanKey"> {
  const current = state.overridesByPlanKey[planKey] ?? EMPTY_OVERRIDES;
  const nextEntries = { ...state.overridesByPlanKey, [planKey]: update(current) };
  const planKeys = Object.keys(nextEntries);
  for (const stalePlanKey of planKeys.slice(0, -MAX_PERSISTED_PLAN_OVERRIDES)) {
    delete nextEntries[stalePlanKey];
  }
  return { overridesByPlanKey: nextEntries };
}

export const useTaskHudStore = create<TaskHudStoreState>()(
  persist(
    (set) => ({
      overridesByPlanKey: {},
      contextTasksByThreadKey: {},
      setTaskCompleted: (planKey, taskId, completed) =>
        set((state) =>
          updateOverrides(state, planKey, (current) => ({
            ...current,
            completedByTaskId: { ...current.completedByTaskId, [taskId]: completed },
          })),
        ),
      removeTask: (planKey, taskId) =>
        set((state) =>
          updateOverrides(state, planKey, (current) => ({
            ...current,
            order: current.order.filter((candidate) => candidate !== taskId),
            removed: current.removed.includes(taskId)
              ? current.removed
              : [...current.removed, taskId],
          })),
        ),
      setTaskOrder: (planKey, taskIds) =>
        set((state) =>
          updateOverrides(state, planKey, (current) => ({
            ...current,
            order: [...new Set(taskIds)],
          })),
        ),
      addContextTask: (threadKey, task) =>
        set((state) => ({
          contextTasksByThreadKey: {
            ...state.contextTasksByThreadKey,
            [threadKey]: [...(state.contextTasksByThreadKey[threadKey] ?? []), task].slice(
              -MAX_PERSISTED_CONTEXT_TASKS,
            ),
          },
        })),
      setContextTaskCompleted: (threadKey, taskId, completed) =>
        set((state) => ({
          contextTasksByThreadKey: {
            ...state.contextTasksByThreadKey,
            [threadKey]: (state.contextTasksByThreadKey[threadKey] ?? []).map((task) =>
              task.id === taskId ? { ...task, completed } : task,
            ),
          },
        })),
      removeContextTask: (threadKey, taskId) =>
        set((state) => ({
          contextTasksByThreadKey: {
            ...state.contextTasksByThreadKey,
            [threadKey]: (state.contextTasksByThreadKey[threadKey] ?? []).filter(
              (task) => task.id !== taskId,
            ),
          },
        })),
      consumeContextTasks: (threadKey, taskIds) => {
        if (taskIds.length === 0) return;
        const sentIds = new Set(taskIds);
        set((state) => ({
          contextTasksByThreadKey: {
            ...state.contextTasksByThreadKey,
            [threadKey]: (state.contextTasksByThreadKey[threadKey] ?? []).filter(
              (task) => !sentIds.has(task.id),
            ),
          },
        }));
      },
      copyContextTasksToFork: ({
        sourceThreadKey,
        targetThreadKey,
        sourceThreadId,
        targetThreadId,
        messageIdBySourceId,
      }) =>
        set((state) => ({
          contextTasksByThreadKey: {
            ...state.contextTasksByThreadKey,
            [targetThreadKey]: (state.contextTasksByThreadKey[sourceThreadKey] ?? []).flatMap(
              (task) => {
                if (task.sourceThreadId !== sourceThreadId) return [task];
                const targetMessageId = messageIdBySourceId[task.sourceMessageId];
                if (!targetMessageId) return [];
                return [
                  {
                    ...task,
                    sourceThreadId: targetThreadId,
                    sourceMessageId: targetMessageId,
                  },
                ];
              },
            ),
          },
        })),
    }),
    {
      name: TASK_HUD_STORAGE_KEY,
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({
        overridesByPlanKey: state.overridesByPlanKey,
        contextTasksByThreadKey: state.contextTasksByThreadKey,
      }),
    },
  ),
);
