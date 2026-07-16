import { scopeThreadRef } from "@v12code/client-runtime/environment";
import { EnvironmentId, MessageId, ThreadId, TurnId } from "@v12code/contracts";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import {
  appendContextTasksToPrompt,
  applyTaskHudOverrides,
  buildForkMessageIdMap,
  extractTrailingTaskAnnotations,
  filterPendingContextTasks,
  identifyTaskHudSteps,
  taskHudPlanKey,
  useTaskHudStore,
} from "./taskHudState";

const steps = [
  { step: "Inspect", status: "completed" as const },
  { step: "Implement", status: "inProgress" as const },
  { step: "Verify", status: "pending" as const },
];

beforeEach(() => {
  useTaskHudStore.setState({ overridesByPlanKey: {}, contextTasksByThreadKey: {} });
});

describe("task HUD state", () => {
  it("turns pending tasks into a sendable prompt without requiring comment text", () => {
    const annotationOnlyPrompt = appendContextTasksToPrompt("", [
      { instruction: "No longer animates width", quote: "No longer animates width" },
    ]);
    expect(annotationOnlyPrompt).toBe(
      '<task_annotations count="1">\n1. No longer animates width\n</task_annotations>',
    );

    const promptWithAnnotation = appendContextTasksToPrompt("Please verify", [
      { instruction: "Check this claim", quote: "The selected claim" },
    ]);
    expect(promptWithAnnotation).toContain(
      'Please verify\n\n<task_annotations count="1">\n1. Check this claim',
    );
    expect(extractTrailingTaskAnnotations(promptWithAnnotation)).toEqual({
      promptText: "Please verify",
      annotationCount: 1,
    });
  });

  it("leaves ordinary sent prompts unchanged when they have no task annotations", () => {
    expect(extractTrailingTaskAnnotations("Please verify")).toEqual({
      promptText: "Please verify",
      annotationCount: 0,
    });
  });

  it("removes sent tasks from the annotation UI", () => {
    const store = useTaskHudStore.getState();
    const task = {
      id: "pending-task",
      instruction: "Send this task",
      quote: "Send this task",
      sourceThreadId: ThreadId.make("thread-1"),
      sourceMessageId: MessageId.make("message-1"),
      sourceAuthor: "assistant" as const,
      sourceCreatedAt: "2026-07-15T00:00:00.000Z",
      completed: false,
      pendingSend: true,
    };
    store.addContextTask("env-1:thread-1", task);
    store.consumeContextTasks("env-1:thread-1", [task.id]);

    expect(useTaskHudStore.getState().contextTasksByThreadKey["env-1:thread-1"]).toEqual([]);
  });

  it("updates a pending annotation instruction", () => {
    const task = {
      id: "pending-task",
      instruction: "Original instruction",
      quote: "Selected text",
      sourceThreadId: ThreadId.make("thread-1"),
      sourceMessageId: MessageId.make("message-1"),
      sourceAuthor: "assistant" as const,
      sourceCreatedAt: "2026-07-15T00:00:00.000Z",
      completed: false,
      pendingSend: true,
    };
    const store = useTaskHudStore.getState();
    store.addContextTask("env-1:thread-1", task);
    store.setContextTaskInstruction("env-1:thread-1", task.id, "Edited instruction");

    expect(useTaskHudStore.getState().contextTasksByThreadKey["env-1:thread-1"]).toEqual([
      { ...task, instruction: "Edited instruction" },
    ]);
  });

  it("hides sent annotations left in persisted state", () => {
    expect(
      filterPendingContextTasks([
        { pendingSend: true } as never,
        { pendingSend: false } as never,
        {} as never,
      ]),
    ).toEqual([{ pendingSend: true }]);
  });

  it("builds a thread and turn scoped persistence key", () => {
    expect(
      taskHudPlanKey(scopeThreadRef(EnvironmentId.make("env-1"), ThreadId.make("thread-1")), {
        turnId: TurnId.make("turn-1"),
        createdAt: "2026-07-15T00:00:00.000Z",
      }),
    ).toBe("env-1:thread-1:turn-1");
  });

  it("gives duplicate task text stable occurrence ids", () => {
    expect(
      identifyTaskHudSteps([
        { step: "Test", status: "pending" },
        { step: "Test", status: "completed" },
      ]).map((step) => step.id),
    ).toEqual(["Test\u00000", "Test\u00001"]);
  });

  it("applies completion, removal, and ordering without losing streamed tasks", () => {
    const identified = identifyTaskHudSteps(steps);
    const overrides = {
      order: [identified[2]!.id, identified[0]!.id],
      removed: [identified[1]!.id],
      completedByTaskId: { [identified[2]!.id]: true },
    };

    expect(applyTaskHudOverrides(steps, overrides)).toEqual([
      { ...identified[2], status: "completed" },
      identified[0],
    ]);

    expect(
      applyTaskHudOverrides([...steps, { step: "Ship", status: "pending" }], overrides).map(
        (step) => step.step,
      ),
    ).toEqual(["Verify", "Inspect", "Ship"]);
  });

  it("persists user task changes in the store", () => {
    const planKey = "env-1:thread-1:turn-1";
    const taskIds = identifyTaskHudSteps(steps).map((step) => step.id);
    const store = useTaskHudStore.getState();
    store.setTaskCompleted(planKey, taskIds[1]!, true);
    store.removeTask(planKey, taskIds[0]!);
    store.setTaskOrder(planKey, [taskIds[2]!, taskIds[1]!]);

    expect(useTaskHudStore.getState().overridesByPlanKey[planKey]).toEqual({
      order: [taskIds[2], taskIds[1]],
      removed: [taskIds[0]],
      completedByTaskId: { [taskIds[1]!]: true },
    });
  });

  it("copies contextual tasks to a fork with remapped message sources", () => {
    const task = {
      id: "task-1",
      instruction: "Verify this claim",
      quote: "the selected claim",
      sourceThreadId: ThreadId.make("thread-1"),
      sourceMessageId: MessageId.make("message-1"),
      sourceAuthor: "assistant" as const,
      sourceCreatedAt: "2026-07-15T00:00:00.000Z",
      completed: false,
    };
    const store = useTaskHudStore.getState();
    store.addContextTask("env-1:thread-1", task);
    const targetMessageId = MessageId.make("message-2");
    store.copyContextTasksToFork({
      sourceThreadKey: "env-1:thread-1",
      targetThreadKey: "env-1:thread-2",
      sourceThreadId: ThreadId.make("thread-1"),
      targetThreadId: ThreadId.make("thread-2"),
      messageIdBySourceId: { "message-1": targetMessageId },
    });

    expect(useTaskHudStore.getState().contextTasksByThreadKey["env-1:thread-2"]).toEqual([
      { ...task, sourceThreadId: ThreadId.make("thread-2"), sourceMessageId: targetMessageId },
    ]);
  });

  it("drops forked tasks whose source message is outside the copied prefix", () => {
    const store = useTaskHudStore.getState();
    store.addContextTask("env-1:thread-1", {
      id: "task-1",
      instruction: "Check this",
      quote: "source",
      sourceThreadId: ThreadId.make("thread-1"),
      sourceMessageId: MessageId.make("message-after-fork"),
      sourceAuthor: "assistant",
      sourceCreatedAt: "2026-01-01T00:00:00.000Z",
      completed: false,
    });

    store.copyContextTasksToFork({
      sourceThreadKey: "env-1:thread-1",
      targetThreadKey: "env-1:thread-2",
      sourceThreadId: ThreadId.make("thread-1"),
      targetThreadId: ThreadId.make("thread-2"),
      messageIdBySourceId: {},
    });

    expect(useTaskHudStore.getState().contextTasksByThreadKey["env-1:thread-2"]).toEqual([]);
  });

  it("maps forked message ids by copied history order", () => {
    expect(
      buildForkMessageIdMap(
        [{ id: MessageId.make("source-1") }, { id: MessageId.make("source-2") }],
        [{ id: MessageId.make("target-1") }, { id: MessageId.make("target-2") }],
      ),
    ).toEqual({ "source-1": "target-1", "source-2": "target-2" });
  });

  it("refuses to remap tasks from a partial fork projection", () => {
    expect(() =>
      buildForkMessageIdMap(
        [{ id: MessageId.make("source-1") }, { id: MessageId.make("source-2") }],
        [{ id: MessageId.make("target-1") }],
      ),
    ).toThrow("Fork history is incomplete");
  });
});
