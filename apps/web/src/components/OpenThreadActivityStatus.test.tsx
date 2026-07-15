import {
  EventId,
  ProviderInstanceId,
  ThreadId,
  TurnId,
  type OrchestrationLatestTurn,
  type OrchestrationSession,
  type OrchestrationThreadActivity,
} from "@t3tools/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import {
  deriveOpenThreadActivityPresentation,
  formatOpenThreadActivityElapsed,
  OpenThreadActivityStatus,
} from "./OpenThreadActivityStatus";

const latestTurn: OrchestrationLatestTurn = {
  turnId: TurnId.make("turn-1"),
  state: "running",
  requestedAt: "2026-07-15T00:00:00.000Z",
  startedAt: "2026-07-15T00:00:01.000Z",
  completedAt: null,
  assistantMessageId: null,
};

const runningSession: OrchestrationSession = {
  threadId: ThreadId.make("thread-1"),
  status: "running",
  providerName: "Codex",
  providerInstanceId: ProviderInstanceId.make("codex"),
  runtimeMode: "full-access",
  activeTurnId: TurnId.make("turn-1"),
  lastError: null,
  updatedAt: "2026-07-15T00:00:01.000Z",
};

const activity: OrchestrationThreadActivity = {
  id: EventId.make("activity-1"),
  tone: "tool",
  kind: "tool.started",
  summary: "Running typecheck",
  payload: {},
  turnId: TurnId.make("turn-1"),
  sequence: 3,
  createdAt: "2026-07-15T00:00:03.000Z",
};

function derive(
  overrides: Partial<Parameters<typeof deriveOpenThreadActivityPresentation>[0]> = {},
) {
  return deriveOpenThreadActivityPresentation({
    session: runningSession,
    latestTurn,
    activities: [activity],
    queued: false,
    running: true,
    activeWorkStartedAt: latestTurn.startedAt,
    pendingApprovalCreatedAt: null,
    pendingUserInputCreatedAt: null,
    error: null,
    ...overrides,
  });
}

describe("deriveOpenThreadActivityPresentation", () => {
  it("shows running work with its latest useful activity", () => {
    expect(derive()).toMatchObject({
      phase: "running",
      label: "Running",
      startedAt: "2026-07-15T00:00:01.000Z",
      latestActivity: "Running typecheck",
    });
  });

  it("puts blocking user states ahead of the underlying running session", () => {
    expect(derive({ pendingApprovalCreatedAt: "2026-07-15T00:00:05.000Z" })).toMatchObject({
      phase: "waiting_for_approval",
      label: "Waiting for approval",
    });
    expect(derive({ pendingUserInputCreatedAt: "2026-07-15T00:00:06.000Z" })).toMatchObject({
      phase: "waiting_for_input",
      label: "Waiting for input",
    });
  });

  it("shows local dispatch as queued until the server acknowledges it", () => {
    expect(derive({ session: null, queued: true, running: false })).toMatchObject({
      phase: "queued",
      label: "Queued",
    });
  });

  it("clears a stale running turn after a reconnect snapshot confirms no session", () => {
    expect(derive({ session: null, running: false })).toBeNull();
  });

  it("uses a settled session when a quick run has no materialized latest turn", () => {
    expect(
      derive({
        session: { ...runningSession, status: "ready", activeTurnId: null },
        latestTurn: null,
        running: false,
      }),
    ).toMatchObject({ phase: "complete", label: "Complete" });
  });

  it("lets a settled reconnect snapshot clear stale blockers and local work", () => {
    expect(
      derive({
        session: { ...runningSession, status: "ready", activeTurnId: null },
        pendingApprovalCreatedAt: "2026-07-15T00:00:05.000Z",
        queued: true,
      }),
    ).toMatchObject({ phase: "complete", label: "Complete" });

    expect(
      derive({
        session: { ...runningSession, status: "stopped", activeTurnId: null },
        pendingUserInputCreatedAt: "2026-07-15T00:00:06.000Z",
        running: true,
      }),
    ).toBeNull();
  });

  it("lets a failed server snapshot clear a stale waiting state", () => {
    expect(
      derive({
        session: {
          ...runningSession,
          status: "error",
          activeTurnId: null,
          lastError: "Provider exited",
        },
        pendingApprovalCreatedAt: "2026-07-15T00:00:05.000Z",
      }),
    ).toMatchObject({ phase: "failed", label: "Failed" });
  });

  it("shows failures and settled completion", () => {
    expect(derive({ error: "Provider exited" })).toMatchObject({
      phase: "failed",
      label: "Failed",
    });
    expect(
      derive({
        session: { ...runningSession, status: "ready", activeTurnId: null },
        latestTurn: {
          ...latestTurn,
          state: "completed",
          completedAt: "2026-07-15T00:02:01.000Z",
        },
        running: false,
      }),
    ).toMatchObject({ phase: "complete", label: "Complete" });
  });
});

describe("formatOpenThreadActivityElapsed", () => {
  it("formats live and completed durations", () => {
    expect(
      formatOpenThreadActivityElapsed({
        startedAt: "2026-07-15T00:00:00.000Z",
        endedAt: null,
        nowMs: Date.parse("2026-07-15T00:01:05.000Z"),
      }),
    ).toBe("1m 05s");
    expect(
      formatOpenThreadActivityElapsed({
        startedAt: "2026-07-15T00:00:00.000Z",
        endedAt: "2026-07-15T01:02:00.000Z",
        nowMs: 0,
      }),
    ).toBe("1h 02m");
  });
});

describe("OpenThreadActivityStatus", () => {
  it("renders an accessible quiet composer status", () => {
    const markup = renderToStaticMarkup(
      <OpenThreadActivityStatus status={derive()} variant="composer" />,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Running. Running typecheck"');
    expect(markup).toContain("Running");
    expect(markup).not.toContain(">Running typecheck<");
    expect(markup).toContain('title="Running typecheck"');
    expect(markup).not.toContain("rounded-full");
  });
});
