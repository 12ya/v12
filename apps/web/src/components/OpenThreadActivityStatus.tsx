import type {
  OrchestrationLatestTurn,
  OrchestrationSession,
  OrchestrationThreadActivity,
} from "@t3tools/contracts";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  LoaderCircleIcon,
  MessageCircleQuestionIcon,
} from "lucide-react";
import { memo, useEffect, useState } from "react";

export type OpenThreadActivityPhase =
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "waiting_for_input"
  | "failed"
  | "complete";

export interface OpenThreadActivityPresentation {
  readonly phase: OpenThreadActivityPhase;
  readonly label: string;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly latestActivity: string | null;
}

interface DeriveOpenThreadActivityInput {
  readonly session: OrchestrationSession | null;
  readonly latestTurn: OrchestrationLatestTurn | null;
  readonly activities: ReadonlyArray<OrchestrationThreadActivity>;
  readonly queued: boolean;
  readonly running: boolean;
  readonly activeWorkStartedAt: string | null;
  readonly pendingApprovalCreatedAt: string | null;
  readonly pendingUserInputCreatedAt: string | null;
  readonly error: string | null;
}

function latestUsefulActivity(
  activities: ReadonlyArray<OrchestrationThreadActivity>,
  turnId: string | null,
): string | null {
  let latest: OrchestrationThreadActivity | null = null;
  for (const activity of activities) {
    if (turnId !== null && activity.turnId !== null && activity.turnId !== turnId) {
      continue;
    }
    if (
      latest === null ||
      activity.createdAt > latest.createdAt ||
      (activity.createdAt === latest.createdAt &&
        (activity.sequence ?? -1) > (latest.sequence ?? -1))
    ) {
      latest = activity;
    }
  }
  return latest?.summary ?? null;
}

/**
 * Resolves one server-backed activity state for the open chat. A terminal
 * session always wins over a stale running turn so reconnect snapshots cannot
 * leave the UI stuck in a working state after the server has settled the run.
 */
export function deriveOpenThreadActivityPresentation(
  input: DeriveOpenThreadActivityInput,
): OpenThreadActivityPresentation | null {
  const activeTurnId = input.session?.activeTurnId ?? input.latestTurn?.turnId ?? null;
  const latestActivity = latestUsefulActivity(input.activities, activeTurnId);
  const base = {
    latestActivity,
  };

  // A settled server snapshot is authoritative. Local dispatch flags, stale
  // pending activities, and a lagging latest turn must not resurrect work after
  // a reconnect confirms that the session has stopped.
  if (input.session?.status === "error") {
    return {
      ...base,
      phase: "failed",
      label: "Failed",
      startedAt: input.latestTurn?.startedAt ?? input.latestTurn?.requestedAt ?? null,
      endedAt: input.latestTurn?.completedAt ?? input.session.updatedAt,
    };
  }
  if (input.session?.status === "ready" || input.session?.status === "idle") {
    return {
      ...base,
      phase: "complete",
      label: "Complete",
      startedAt:
        input.latestTurn?.startedAt ?? input.latestTurn?.requestedAt ?? input.session.updatedAt,
      endedAt: input.latestTurn?.completedAt ?? input.session.updatedAt,
    };
  }
  if (input.session?.status === "interrupted" || input.session?.status === "stopped") {
    return null;
  }

  if (input.pendingApprovalCreatedAt !== null) {
    return {
      ...base,
      phase: "waiting_for_approval",
      label: "Waiting for approval",
      startedAt: input.pendingApprovalCreatedAt,
      endedAt: null,
    };
  }
  if (input.pendingUserInputCreatedAt !== null) {
    return {
      ...base,
      phase: "waiting_for_input",
      label: "Waiting for input",
      startedAt: input.pendingUserInputCreatedAt,
      endedAt: null,
    };
  }
  if (input.error !== null || input.latestTurn?.state === "error") {
    return {
      ...base,
      phase: "failed",
      label: "Failed",
      startedAt: input.latestTurn?.startedAt ?? input.latestTurn?.requestedAt ?? null,
      endedAt: input.latestTurn?.completedAt ?? input.session?.updatedAt ?? null,
    };
  }
  if (input.queued || input.session?.status === "starting") {
    return {
      ...base,
      phase: "queued",
      label: "Queued",
      startedAt: input.activeWorkStartedAt,
      endedAt: null,
    };
  }
  if (input.running || input.session?.status === "running") {
    return {
      ...base,
      phase: "running",
      label: "Running",
      startedAt:
        input.activeWorkStartedAt ??
        input.latestTurn?.startedAt ??
        input.latestTurn?.requestedAt ??
        null,
      endedAt: null,
    };
  }
  if (
    input.latestTurn?.state === "completed" ||
    (input.latestTurn?.state === "interrupted" && input.latestTurn.completedAt !== null)
  ) {
    return {
      ...base,
      phase: "complete",
      label: "Complete",
      startedAt:
        input.latestTurn?.startedAt ??
        input.latestTurn?.requestedAt ??
        input.session?.updatedAt ??
        null,
      endedAt: input.latestTurn?.completedAt ?? input.session?.updatedAt ?? null,
    };
  }
  return null;
}

export function formatOpenThreadActivityElapsed(input: {
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly nowMs: number;
}): string | null {
  if (input.startedAt === null) return null;
  const startedAtMs = Date.parse(input.startedAt);
  const endedAtMs = input.endedAt === null ? input.nowMs : Date.parse(input.endedAt);
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs) || endedAtMs < startedAtMs) {
    return null;
  }

  const elapsedSeconds = Math.floor((endedAtMs - startedAtMs) / 1_000);
  const hours = Math.floor(elapsedSeconds / 3_600);
  const minutes = Math.floor((elapsedSeconds % 3_600) / 60);
  const seconds = elapsedSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

function StatusIcon({ phase }: { readonly phase: OpenThreadActivityPhase }) {
  switch (phase) {
    case "queued":
    case "running":
      return <LoaderCircleIcon className="size-3.5 animate-spin text-sky-500" aria-hidden />;
    case "waiting_for_approval":
      return <Clock3Icon className="size-3.5 text-amber-500" aria-hidden />;
    case "waiting_for_input":
      return <MessageCircleQuestionIcon className="size-3.5 text-indigo-500" aria-hidden />;
    case "failed":
      return <CircleAlertIcon className="size-3.5 text-destructive" aria-hidden />;
    case "complete":
      return <CheckCircle2Icon className="size-3.5 text-emerald-500" aria-hidden />;
  }
}

export const OpenThreadActivityStatus = memo(function OpenThreadActivityStatus({
  status,
  variant = "pill",
}: {
  readonly status: OpenThreadActivityPresentation | null;
  readonly variant?: "pill" | "composer";
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isLive =
    status?.phase === "queued" ||
    status?.phase === "running" ||
    status?.phase === "waiting_for_approval" ||
    status?.phase === "waiting_for_input";

  useEffect(() => {
    if (!isLive) return;
    setNowMs(Date.now());
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [isLive, status?.startedAt]);

  if (status === null) return null;
  const elapsed = formatOpenThreadActivityElapsed({
    startedAt: status.startedAt,
    endedAt: status.endedAt,
    nowMs,
  });

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        status.latestActivity ? `${status.label}. ${status.latestActivity}` : status.label
      }
      title={variant === "composer" ? (status.latestActivity ?? undefined) : undefined}
      data-testid="open-thread-activity-status"
      className={
        variant === "composer"
          ? "inline-flex h-7 max-w-32 shrink-0 items-center gap-1 px-1 text-[10px] text-muted-foreground/65"
          : "inline-flex h-6 max-w-[min(24rem,calc(100vw-2rem))] items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2 text-[11px] shadow-sm backdrop-blur-sm"
      }
    >
      <div aria-hidden className={variant === "composer" ? "contents opacity-75" : "contents"}>
        <StatusIcon phase={status.phase} />
        <span
          className={
            variant === "composer"
              ? "shrink-0 font-medium text-muted-foreground"
              : "shrink-0 font-medium text-foreground/90"
          }
        >
          {status.label}
        </span>
        {elapsed ? (
          <>
            {variant === "composer" ? <span className="text-muted-foreground/40">·</span> : null}
            <span className="shrink-0 tabular-nums text-muted-foreground">{elapsed}</span>
          </>
        ) : null}
        {status.latestActivity && variant !== "composer" ? (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span className="min-w-0 truncate text-muted-foreground">{status.latestActivity}</span>
          </>
        ) : null}
      </div>
    </div>
  );
});
