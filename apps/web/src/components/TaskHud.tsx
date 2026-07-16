import type { EnvironmentId, ScopedThreadRef } from "@v12code/contracts";
import { scopedThreadKey } from "@v12code/client-runtime/environment";
import type { TimestampFormat } from "@v12code/contracts/settings";
import { CheckIcon, ListTodoIcon, Trash2Icon, XIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

import type { ActivePlanState, LatestProposedPlanState } from "../session-logic";
import {
  applyTaskHudOverrides,
  filterPendingContextTasks,
  taskHudPlanKey,
  useTaskHudStore,
  type ContextualTask,
} from "../taskHudState";
import PlanSidebar from "./PlanSidebar";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";

interface TaskHudProps {
  readonly activePlan: ActivePlanState | null;
  readonly activeProposedPlan: LatestProposedPlanState | null;
  readonly label: string;
  readonly environmentId: EnvironmentId;
  readonly threadRef: ScopedThreadRef;
  readonly markdownCwd: string | undefined;
  readonly workspaceRoot: string | undefined;
  readonly timestampFormat: TimestampFormat;
  readonly mode?: "trigger" | "toolbar" | "panel";
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenTaskSource: (task: ContextualTask) => void;
}

const EMPTY_CONTEXT_TASKS: readonly ContextualTask[] = Object.freeze([]);

export const TaskHud = memo(function TaskHud({
  activePlan,
  activeProposedPlan,
  label,
  environmentId,
  threadRef,
  markdownCwd,
  workspaceRoot,
  timestampFormat,
  mode = "trigger",
  open,
  onOpenChange,
  onOpenTaskSource,
}: TaskHudProps) {
  const threadKey = scopedThreadKey(threadRef);
  const storedContextTasks = useTaskHudStore(
    (state) => state.contextTasksByThreadKey[threadKey] ?? EMPTY_CONTEXT_TASKS,
  );
  const contextTasks = useMemo(
    () => filterPendingContextTasks(storedContextTasks),
    [storedContextTasks],
  );
  const planKey = activePlan ? taskHudPlanKey(threadRef, activePlan) : null;
  const overrides = useTaskHudStore((state) =>
    planKey === null ? undefined : state.overridesByPlanKey[planKey],
  );
  const steps = useMemo(
    () => applyTaskHudOverrides(activePlan?.steps ?? [], overrides),
    [activePlan?.steps, overrides],
  );
  const displayedPlan = useMemo<ActivePlanState | null>(
    () => (activePlan ? { ...activePlan, steps } : null),
    [activePlan, steps],
  );
  const completedCount =
    steps.filter((step) => step.status === "completed").length +
    contextTasks.filter((task) => task.completed).length;
  const totalCount = steps.length + contextTasks.length;

  const handleToggleStep = useCallback(
    (index: number) => {
      const task = steps[index];
      if (!planKey || !task) return;
      useTaskHudStore.getState().setTaskCompleted(planKey, task.id, task.status !== "completed");
    },
    [planKey, steps],
  );
  const handleRemoveStep = useCallback(
    (index: number) => {
      const task = steps[index];
      if (!planKey || !task) return;
      useTaskHudStore.getState().removeTask(planKey, task.id);
    },
    [planKey, steps],
  );
  const handleReorderStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!planKey) return;
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= steps.length || toIndex >= steps.length) {
        return;
      }
      const nextOrder = steps.map((step) => step.id);
      const [moved] = nextOrder.splice(fromIndex, 1);
      if (!moved) return;
      nextOrder.splice(toIndex, 0, moved);
      useTaskHudStore.getState().setTaskOrder(planKey, nextOrder);
    },
    [planKey, steps],
  );

  if (!activePlan && !activeProposedPlan && contextTasks.length === 0) return null;

  if (mode === "toolbar") {
    const accessibleLabel = `${label}: ${completedCount} of ${totalCount} tasks complete`;
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              className="shrink-0 [-webkit-app-region:no-drag]"
              pressed={open}
              onPressedChange={onOpenChange}
              aria-label={accessibleLabel}
              variant="ghost"
              size="sm"
            >
              <ListTodoIcon className="size-3.5" />
            </Toggle>
          }
        />
        <TooltipPopup side="bottom">
          {label} {completedCount}/{totalCount}
        </TooltipPopup>
      </Tooltip>
    );
  }

  if (mode === "trigger") {
    return (
      <Button
        size="sm"
        variant="outline"
        aria-label={`${label}: ${completedCount} of ${totalCount} tasks complete`}
        aria-expanded={open}
        className="pointer-events-auto h-6 gap-1 rounded-full bg-background/90 px-2 text-[11px] shadow-sm backdrop-blur-sm"
        onClick={() => onOpenChange(!open)}
      >
        <ListTodoIcon className="size-3" />
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </Button>
    );
  }

  return (
    <aside
      aria-label={`${label} summary`}
      className="max-h-[calc(100vh-8rem)] w-full select-none overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-lg backdrop-blur-sm"
    >
      <header className="flex h-10 items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2">
          <ListTodoIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Close ${label}`}
          onClick={() => onOpenChange(false)}
        >
          <XIcon className="size-3.5" />
        </Button>
      </header>
      <div className="max-h-[calc(100vh-10.5rem)] overflow-y-auto">
        {contextTasks.length > 0 ? (
          <section
            className={
              activePlan || activeProposedPlan
                ? "border-y border-border/60 p-2.5"
                : "border-t border-border/60 p-2.5"
            }
            aria-label="Conversation tasks"
          >
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">From conversation</p>
            <div className="max-h-48 space-y-1 overflow-auto">
              {contextTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start gap-2 rounded-md p-1.5 hover:bg-accent/30"
                >
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                    onClick={() =>
                      useTaskHudStore
                        .getState()
                        .setContextTaskCompleted(threadKey, task.id, !task.completed)
                    }
                  >
                    <CheckIcon className={task.completed ? "size-3" : "size-3 opacity-20"} />
                  </Button>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onOpenTaskSource(task)}
                  >
                    <p className={task.completed ? "text-xs line-through opacity-60" : "text-xs"}>
                      {task.instruction}
                    </p>
                    {task.quote !== task.instruction ? (
                      <p className="truncate text-[11px] text-muted-foreground">“{task.quote}”</p>
                    ) : null}
                  </button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Remove task"
                    onClick={() => useTaskHudStore.getState().removeContextTask(threadKey, task.id)}
                  >
                    <Trash2Icon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {activePlan || activeProposedPlan ? (
          <div className="min-h-0">
            <PlanSidebar
              activePlan={displayedPlan}
              activeProposedPlan={activeProposedPlan}
              label={label}
              environmentId={environmentId}
              threadRef={threadRef}
              markdownCwd={markdownCwd}
              workspaceRoot={workspaceRoot}
              timestampFormat={timestampFormat}
              mode="summary"
              onToggleStep={handleToggleStep}
              onRemoveStep={handleRemoveStep}
              onReorderStep={handleReorderStep}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
});
