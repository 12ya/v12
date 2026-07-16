import { memo, useCallback, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragCancelEvent,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@v12code/client-runtime/state/runtime";
import type { EnvironmentId, ScopedThreadRef } from "@v12code/contracts";
import { type TimestampFormat } from "@v12code/contracts/settings";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import ChatMarkdown from "./ChatMarkdown";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisIcon,
  GripVerticalIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { ActivePlanState } from "../session-logic";
import type { LatestProposedPlanState } from "../session-logic";
import { formatTimestamp } from "../timestampFormat";
import {
  proposedPlanTitle,
  buildProposedPlanMarkdownFilename,
  normalizePlanMarkdownForExport,
  downloadPlanAsTextFile,
  stripDisplayedPlanMarkdown,
} from "../proposedPlan";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "./ui/menu";
import { projectEnvironment } from "~/state/projects";
import { stackedThreadToast, toastManager } from "./ui/toast";
import { useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { useAtomCommand } from "~/state/use-atom-command";

function stepStatusIcon(status: string): React.ReactNode {
  if (status === "completed") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success-foreground">
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (status === "inProgress") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LoaderIcon className="size-3 animate-spin" />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30">
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
    </span>
  );
}

interface PlanSidebarProps {
  activePlan: ActivePlanState | null;
  activeProposedPlan: LatestProposedPlanState | null;
  label?: string;
  environmentId: EnvironmentId;
  threadRef?: ScopedThreadRef | undefined;
  markdownCwd: string | undefined;
  workspaceRoot: string | undefined;
  timestampFormat: TimestampFormat;
  mode?: "sheet" | "sidebar" | "embedded" | "popover" | "summary";
  onToggleStep?: ((index: number) => void) | undefined;
  onRemoveStep?: ((index: number) => void) | undefined;
  onReorderStep?: ((fromIndex: number, toIndex: number) => void) | undefined;
}

interface SortablePlanStepRowProps {
  readonly taskId: string;
  readonly step: ActivePlanState["steps"][number];
  readonly index: number;
  readonly canReorder: boolean;
  readonly onToggleStep: ((index: number) => void) | undefined;
  readonly onRemoveStep: ((index: number) => void) | undefined;
}

function SortablePlanStepRow({
  taskId,
  step,
  index,
  canReorder,
  onToggleStep,
  onRemoveStep,
}: SortablePlanStepRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId, disabled: !canReorder });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/task flex select-none items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200",
        step.status === "inProgress" && "bg-blue-500/5",
        step.status === "completed" && "bg-emerald-500/5",
        isDragging && "relative z-10 opacity-70 shadow-sm",
      )}
    >
      {onToggleStep ? (
        <button
          type="button"
          aria-label={
            step.status === "completed"
              ? `Mark task incomplete: ${step.step}`
              : `Mark task complete: ${step.step}`
          }
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onToggleStep(index)}
        >
          {stepStatusIcon(step.status)}
        </button>
      ) : (
        stepStatusIcon(step.status)
      )}
      <p
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug",
          step.status === "completed"
            ? "text-muted-foreground/50 line-through decoration-muted-foreground/20"
            : step.status === "inProgress"
              ? "text-foreground/90"
              : "text-muted-foreground/70",
        )}
      >
        {step.step}
      </p>
      {canReorder || onRemoveStep ? (
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/task:opacity-100 group-focus-within/task:opacity-100">
          {canReorder ? (
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label={`Reorder task: ${step.step}`}
              className="inline-flex size-6 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring"
              {...attributes}
              {...listeners}
            >
              <GripVerticalIcon className="size-3" />
            </button>
          ) : null}
          {onRemoveStep ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Remove task: ${step.step}`}
              onClick={() => onRemoveStep(index)}
            >
              <XIcon className="size-3" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function releasePointerDragFocus(event: DragEndEvent | DragCancelEvent): void {
  if (typeof PointerEvent === "undefined" || !(event.activatorEvent instanceof PointerEvent)) {
    return;
  }
  const focusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  requestAnimationFrame(() => {
    if (focusedElement && document.activeElement === focusedElement) {
      focusedElement.blur();
    }
  });
}

const PlanSidebar = memo(function PlanSidebar({
  activePlan,
  activeProposedPlan,
  label = "Plan",
  environmentId,
  threadRef,
  markdownCwd,
  workspaceRoot,
  timestampFormat,
  mode = "sidebar",
  onToggleStep,
  onRemoveStep,
  onReorderStep,
}: PlanSidebarProps) {
  const [proposedPlanExpanded, setProposedPlanExpanded] = useState(false);
  const [isSavingToWorkspace, setIsSavingToWorkspace] = useState(false);
  const writeProjectFile = useAtomCommand(projectEnvironment.writeFile, {
    reportFailure: false,
  });
  const { copyToClipboard, isCopied } = useCopyToClipboard({ target: "plan" });

  const planMarkdown = activeProposedPlan?.planMarkdown ?? null;
  const displayedPlanMarkdown = planMarkdown ? stripDisplayedPlanMarkdown(planMarkdown) : null;
  const planTitle = planMarkdown ? proposedPlanTitle(planMarkdown) : null;
  const renderedPlanSteps = useMemo(() => {
    const occurrenceByText = new Map<string, number>();
    return (activePlan?.steps ?? []).map((step) => {
      const occurrence = occurrenceByText.get(step.step) ?? 0;
      occurrenceByText.set(step.step, occurrence + 1);
      return { key: `${step.step}\u0000${occurrence}`, step };
    });
  }, [activePlan?.steps]);
  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleStepDragEnd = useCallback(
    (event: DragEndEvent) => {
      releasePointerDragFocus(event);
      if (!onReorderStep || !event.over || event.active.id === event.over.id) return;
      const fromIndex = renderedPlanSteps.findIndex(({ key }) => key === event.active.id);
      const toIndex = renderedPlanSteps.findIndex(({ key }) => key === event.over?.id);
      if (fromIndex < 0 || toIndex < 0) return;
      onReorderStep(fromIndex, toIndex);
    },
    [onReorderStep, renderedPlanSteps],
  );
  const handleStepDragCancel = useCallback((event: DragCancelEvent) => {
    releasePointerDragFocus(event);
  }, []);

  const handleCopyPlan = useCallback(() => {
    if (!planMarkdown) return;
    copyToClipboard(planMarkdown);
  }, [planMarkdown, copyToClipboard]);

  const handleDownload = useCallback(() => {
    if (!planMarkdown) return;
    const filename = buildProposedPlanMarkdownFilename(planMarkdown);
    downloadPlanAsTextFile(filename, normalizePlanMarkdownForExport(planMarkdown));
  }, [planMarkdown]);

  const handleSaveToWorkspace = useCallback(() => {
    if (!workspaceRoot || !planMarkdown) return;
    const filename = buildProposedPlanMarkdownFilename(planMarkdown);
    setIsSavingToWorkspace(true);
    void (async () => {
      const result = await writeProjectFile({
        environmentId,
        input: {
          cwd: workspaceRoot,
          relativePath: filename,
          contents: normalizePlanMarkdownForExport(planMarkdown),
        },
      });
      setIsSavingToWorkspace(false);
      if (result._tag === "Success") {
        toastManager.add({
          type: "success",
          title: "Plan saved",
          description: result.value.relativePath,
        });
        return;
      }
      if (!isAtomCommandInterrupted(result)) {
        const error = squashAtomCommandFailure(result);
        toastManager.add(
          stackedThreadToast({
            type: "error",
            title: "Could not save plan",
            description: error instanceof Error ? error.message : "An error occurred.",
          }),
        );
      }
    })();
  }, [environmentId, planMarkdown, workspaceRoot, writeProjectFile]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-card/50",
        mode === "sidebar"
          ? "h-full w-[340px] shrink-0 border-l border-border/70"
          : mode === "summary"
            ? "h-auto w-full bg-transparent"
            : "h-full w-full",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3",
          mode === "summary" && "hidden",
        )}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="info"
            size="sm"
            className="rounded-md px-1.5 py-0 font-semibold tracking-wide uppercase"
          >
            {label}
          </Badge>
          {activePlan ? (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              {formatTimestamp(activePlan.createdAt, timestampFormat)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {planMarkdown ? (
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-muted-foreground/50 hover:text-foreground/70"
                    aria-label="Plan actions"
                  />
                }
              >
                <EllipsisIcon className="size-3.5" />
              </MenuTrigger>
              <MenuPopup align="end">
                <MenuItem onClick={handleCopyPlan}>
                  {isCopied ? "Copied!" : "Copy to clipboard"}
                </MenuItem>
                <MenuItem onClick={handleDownload}>Download as markdown</MenuItem>
                <MenuItem
                  onClick={handleSaveToWorkspace}
                  disabled={!workspaceRoot || isSavingToWorkspace}
                >
                  Save to workspace
                </MenuItem>
              </MenuPopup>
            </Menu>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className={mode === "summary" ? "max-h-[calc(100vh-12rem)]" : "min-h-0 flex-1"}>
        <div className={cn("space-y-4", mode === "summary" ? "p-2.5" : "p-3")}>
          {/* Explanation */}
          {activePlan?.explanation ? (
            <p className="text-[13px] leading-relaxed text-muted-foreground/80">
              {activePlan.explanation}
            </p>
          ) : null}

          {/* Plan Steps */}
          {activePlan && activePlan.steps.length > 0 ? (
            <div className="space-y-1">
              <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
                Steps
              </p>
              <DndContext
                sensors={reorderSensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                onDragEnd={handleStepDragEnd}
                onDragCancel={handleStepDragCancel}
              >
                <SortableContext
                  items={renderedPlanSteps.map(({ key }) => key)}
                  strategy={verticalListSortingStrategy}
                >
                  {renderedPlanSteps.map(({ key, step }, index) => (
                    <SortablePlanStepRow
                      key={key}
                      taskId={key}
                      step={step}
                      index={index}
                      canReorder={Boolean(onReorderStep)}
                      onToggleStep={onToggleStep}
                      onRemoveStep={onRemoveStep}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          ) : null}

          {/* Proposed Plan Markdown */}
          {planMarkdown ? (
            <div className="space-y-2">
              <button
                type="button"
                className="group flex w-full items-center gap-1.5 text-left"
                onClick={() => setProposedPlanExpanded((v) => !v)}
              >
                {proposedPlanExpanded ? (
                  <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/40 transition-transform" />
                ) : (
                  <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground/40 transition-transform" />
                )}
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase group-hover:text-muted-foreground/60">
                  {planTitle ?? "Full Plan"}
                </span>
              </button>
              {proposedPlanExpanded ? (
                <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <ChatMarkdown
                    text={displayedPlanMarkdown ?? ""}
                    cwd={markdownCwd}
                    threadRef={threadRef}
                    isStreaming={false}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Empty state */}
          {!activePlan && !planMarkdown ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] text-muted-foreground/40">No active plan yet.</p>
              <p className="mt-1 text-[11px] text-muted-foreground/30">
                Plans will appear here when generated.
              </p>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
});

export default PlanSidebar;
export type { PlanSidebarProps };
