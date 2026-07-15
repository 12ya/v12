import type { EnvironmentId, ScopedThreadRef } from "@t3tools/contracts";
import { scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { TimestampFormat } from "@t3tools/contracts/settings";
import { CheckIcon, ListTodoIcon, Trash2Icon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

import type { ActivePlanState, LatestProposedPlanState } from "../session-logic";
import {
  applyTaskHudOverrides,
  taskHudPlanKey,
  useTaskHudStore,
  type ContextualTask,
} from "../taskHudState";
import PlanSidebar from "./PlanSidebar";
import { Button } from "./ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "./ui/popover";

interface TaskHudProps {
  readonly activePlan: ActivePlanState | null;
  readonly activeProposedPlan: LatestProposedPlanState | null;
  readonly label: string;
  readonly environmentId: EnvironmentId;
  readonly threadRef: ScopedThreadRef;
  readonly markdownCwd: string | undefined;
  readonly workspaceRoot: string | undefined;
  readonly timestampFormat: TimestampFormat;
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
  open,
  onOpenChange,
  onOpenTaskSource,
}: TaskHudProps) {
  const threadKey = scopedThreadKey(threadRef);
  const contextTasks = useTaskHudStore(
    (state) => state.contextTasksByThreadKey[threadKey] ?? EMPTY_CONTEXT_TASKS,
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
  const handleMoveStep = useCallback(
    (index: number, direction: -1 | 1) => {
      if (!planKey) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= steps.length) return;
      const nextOrder = steps.map((step) => step.id);
      const [moved] = nextOrder.splice(index, 1);
      if (!moved) return;
      nextOrder.splice(targetIndex, 0, moved);
      useTaskHudStore.getState().setTaskOrder(planKey, nextOrder);
    },
    [planKey, steps],
  );

  if (!activePlan && !activeProposedPlan && contextTasks.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            aria-label={`${label}: ${completedCount} of ${totalCount} tasks complete`}
            className="pointer-events-auto h-7 gap-1.5 rounded-full bg-background/90 px-2.5 text-xs shadow-sm backdrop-blur-sm"
          />
        }
      >
        <ListTodoIcon className="size-3.5" />
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </PopoverTrigger>
      <PopoverPopup
        side="bottom"
        align="end"
        sideOffset={6}
        positionerClassName="transition-none"
        className="h-[min(32rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-1rem))] translate-x-0 overflow-hidden transition-[translate,opacity] duration-150 ease-out will-change-transform data-ending-style:translate-x-4 data-ending-style:scale-100 data-ending-style:opacity-0 data-starting-style:translate-x-4 data-starting-style:scale-100 motion-reduce:transition-none motion-reduce:data-ending-style:translate-x-0 motion-reduce:data-starting-style:translate-x-0"
        viewportClassName="p-0 [--viewport-inline-padding:0px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {contextTasks.length > 0 ? (
            <section
              className="shrink-0 border-b border-border p-3"
              aria-label="Conversation tasks"
            >
              <p className="mb-2 text-xs font-medium text-muted-foreground">From conversation</p>
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
                      onClick={() =>
                        useTaskHudStore.getState().removeContextTask(threadKey, task.id)
                      }
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {activePlan || activeProposedPlan ? (
            <div className="min-h-0 flex-1">
              <PlanSidebar
                activePlan={displayedPlan}
                activeProposedPlan={activeProposedPlan}
                label={label}
                environmentId={environmentId}
                threadRef={threadRef}
                markdownCwd={markdownCwd}
                workspaceRoot={workspaceRoot}
                timestampFormat={timestampFormat}
                mode="popover"
                onToggleStep={handleToggleStep}
                onRemoveStep={handleRemoveStep}
                onMoveStep={handleMoveStep}
              />
            </div>
          ) : null}
        </div>
      </PopoverPopup>
    </Popover>
  );
});
