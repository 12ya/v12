import { EnvironmentId, MessageId, ThreadId } from "@v12code/contracts";
import { createRef, type ReactNode, type Ref } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
import type { LegendListRef } from "@legendapp/list/react";
import type { ContextualTask } from "../../taskHudState";

vi.mock("@legendapp/list/react", async () => {
  const legendListTestId = "legend-list";

  const LegendList = (props: {
    data: Array<{ id: string }>;
    keyExtractor: (item: { id: string }) => string;
    renderItem: (args: { item: { id: string } }) => ReactNode;
    ListHeaderComponent?: ReactNode;
    ListFooterComponent?: ReactNode;
    anchoredEndSpace?: {
      anchorIndex: number;
      anchorMaxSize?: number;
      anchorOffset?: number;
      onReady?: (info: { anchorIndex: number }) => void;
      onSizeChanged?: (size: number) => void;
    };
    contentInsetEndAdjustment?: number;
    className?: string;
    maintainScrollAtEnd?:
      | boolean
      | {
          animated?: boolean;
          on?: {
            dataChange?: boolean;
            itemLayout?: boolean;
            layout?: boolean;
          };
        };
    maintainVisibleContentPosition?:
      | boolean
      | {
          data?: boolean;
          size?: boolean;
          shouldRestorePosition?: (item: { id: string }) => boolean;
        };
    ref?: Ref<LegendListRef>;
  }) => {
    if (props.anchoredEndSpace) {
      props.anchoredEndSpace.onSizeChanged?.(240);
      props.anchoredEndSpace.onReady?.({ anchorIndex: props.anchoredEndSpace.anchorIndex });
    }
    return (
      <div
        data-testid={legendListTestId}
        data-anchor-index={props.anchoredEndSpace?.anchorIndex}
        data-anchor-max-size={props.anchoredEndSpace?.anchorMaxSize}
        data-anchor-offset={props.anchoredEndSpace?.anchorOffset}
        data-anchor-on-ready={Boolean(props.anchoredEndSpace?.onReady)}
        data-content-inset-end={props.contentInsetEndAdjustment}
        data-class-name={props.className}
        data-maintain-scroll-at-end={props.maintainScrollAtEnd ? "enabled" : undefined}
        data-maintain-scroll-at-end-animated={
          typeof props.maintainScrollAtEnd === "object"
            ? props.maintainScrollAtEnd.animated
            : undefined
        }
        data-maintain-scroll-at-end-data-change={
          typeof props.maintainScrollAtEnd === "object"
            ? props.maintainScrollAtEnd.on?.dataChange
            : undefined
        }
        data-maintain-scroll-at-end-item-layout={
          typeof props.maintainScrollAtEnd === "object"
            ? props.maintainScrollAtEnd.on?.itemLayout
            : undefined
        }
        data-maintain-scroll-at-end-layout={
          typeof props.maintainScrollAtEnd === "object"
            ? props.maintainScrollAtEnd.on?.layout
            : undefined
        }
        data-maintain-visible-content-position={
          typeof props.maintainVisibleContentPosition === "object"
            ? "object"
            : props.maintainVisibleContentPosition
        }
        data-maintain-visible-content-position-data={
          typeof props.maintainVisibleContentPosition === "object"
            ? props.maintainVisibleContentPosition.data
            : undefined
        }
        data-maintain-visible-content-position-size={
          typeof props.maintainVisibleContentPosition === "object"
            ? props.maintainVisibleContentPosition.size
            : undefined
        }
      >
        {props.ListHeaderComponent}
        {props.data.map((item) => (
          <div key={props.keyExtractor(item)}>{props.renderItem({ item })}</div>
        ))}
        {props.ListFooterComponent}
      </div>
    );
  };

  return { LegendList };
});

function MockFileDiff(props: {
  fileDiff: { name?: string | null; prevName?: string | null };
  renderCustomHeader?: (fileDiff: {
    name?: string | null;
    prevName?: string | null;
  }) => React.ReactNode;
}) {
  return (
    <div data-testid="file-diff">
      {props.renderCustomHeader?.(props.fileDiff)}
      {props.fileDiff.name ?? props.fileDiff.prevName ?? "diff"}
    </div>
  );
}

vi.mock("@pierre/diffs/react", () => {
  return { FileDiff: MockFileDiff };
});

function matchMedia() {
  return {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

beforeAll(() => {
  const classList = {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false,
  };

  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
  vi.stubGlobal("window", {
    matchMedia,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    },
    cancelAnimationFrame: () => {},
    desktopBridge: undefined,
  });
  vi.stubGlobal("document", {
    documentElement: {
      classList,
      offsetHeight: 0,
    },
  });
});

const ACTIVE_THREAD_ENVIRONMENT_ID = EnvironmentId.make("environment-local");
const MESSAGE_CREATED_AT = "2026-03-17T19:12:28.000Z";

function buildProps() {
  return {
    isWorking: false,
    activeTurnInProgress: false,
    activeTurnStartedAt: null,
    listRef: createRef<LegendListRef | null>(),
    latestTurn: null,
    runningTurnId: null,
    turnDiffSummaryByAssistantMessageId: new Map(),
    routeThreadKey: "environment-local:thread-1",
    onOpenTurnDiff: () => {},
    revertTurnCountByUserMessageId: new Map(),
    onRevertUserMessage: () => {},
    onForkMessage: () => {},
    isRevertingCheckpoint: false,
    onImageExpand: () => {},
    activeThreadEnvironmentId: ACTIVE_THREAD_ENVIRONMENT_ID,
    markdownCwd: undefined,
    resolvedTheme: "light" as const,
    timestampFormat: "locale" as const,
    workspaceRoot: undefined,
    anchorMessageId: null,
    onAnchorReady: () => {},
    onAnchorSizeChanged: () => {},
    contentInsetEndAdjustment: 0,
    onIsAtEndChange: () => {},
  };
}

function buildLongUserMessageText(tail = "deep hidden detail only after expand") {
  return Array.from({ length: 9 }, (_, index) =>
    index === 8 ? tail : `Line ${index + 1}: ${"verbose prompt content ".repeat(8).trim()}`,
  ).join("\n");
}

function buildUserTimelineEntry(text: string) {
  return {
    id: "entry-1",
    kind: "message" as const,
    createdAt: MESSAGE_CREATED_AT,
    message: {
      id: MessageId.make("message-1"),
      role: "user" as const,
      text,
      turnId: null,
      createdAt: MESSAGE_CREATED_AT,
      updatedAt: MESSAGE_CREATED_AT,
      streaming: false,
    },
  };
}

describe("MessagesTimeline", () => {
  it("allows selected text to be saved as a task without optional context", async () => {
    const {
      groupContextTaskOrdinalsByQuote,
      groupContextTasksBySourceMessageId,
      resolveSelectionTaskInstruction,
      shouldSaveSelectionTaskContextOnKeyDown,
    } = await import("./MessagesTimeline");

    expect(resolveSelectionTaskInstruction("Selected requirement", "")).toBe(
      "Selected requirement",
    );
    expect(
      resolveSelectionTaskInstruction("Selected requirement", "  Verify this behavior  "),
    ).toBe("Verify this behavior");
    expect(
      shouldSaveSelectionTaskContextOnKeyDown({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
      }),
    ).toBe(true);
    expect(
      shouldSaveSelectionTaskContextOnKeyDown({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
      }),
    ).toBe(false);
    expect(
      shouldSaveSelectionTaskContextOnKeyDown({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
      }),
    ).toBe(false);

    const firstMessageId = MessageId.make("message-1");
    const secondMessageId = MessageId.make("message-2");
    const sourceThreadId = ThreadId.make("thread-1");
    const tasks: ContextualTask[] = [
      {
        id: "task-1",
        instruction: "First task",
        quote: "First quote",
        sourceThreadId,
        sourceMessageId: firstMessageId,
        sourceAuthor: "assistant",
        sourceCreatedAt: MESSAGE_CREATED_AT,
        completed: false,
      },
      {
        id: "task-2",
        instruction: "Second task",
        quote: "Second quote",
        sourceThreadId,
        sourceMessageId: firstMessageId,
        sourceAuthor: "assistant",
        sourceCreatedAt: MESSAGE_CREATED_AT,
        completed: false,
      },
      {
        id: "task-3",
        instruction: "Third task",
        quote: "Third quote",
        sourceThreadId,
        sourceMessageId: secondMessageId,
        sourceAuthor: "user",
        sourceCreatedAt: MESSAGE_CREATED_AT,
        completed: false,
      },
    ];
    const groupedTasks = groupContextTasksBySourceMessageId(tasks);
    expect(groupedTasks.get(firstMessageId)).toEqual(tasks.slice(0, 2));
    expect(groupedTasks.get(secondMessageId)).toEqual(tasks.slice(2));

    const ordinalByTaskId = new Map(tasks.map((task, index) => [task.id, index + 1] as const));
    expect(groupContextTaskOrdinalsByQuote(tasks, ordinalByTaskId)).toEqual(
      new Map([
        ["First quote", [1]],
        ["Second quote", [2]],
        ["Third quote", [3]],
      ]),
    );
    expect(
      groupContextTaskOrdinalsByQuote(
        [...tasks, { ...tasks[0]!, id: "task-4" }],
        new Map([...ordinalByTaskId, ["task-4", 4]]),
      ),
    ).toEqual(
      new Map([
        ["First quote", [1, 4]],
        ["Second quote", [2]],
        ["Third quote", [3]],
      ]),
    );
  });

  it("uses LegendList isNearEnd when deciding whether the live edge is visible", async () => {
    const { resolveTimelineIsAtEnd, resolveTimelineScrollThumb } =
      await import("./MessagesTimeline.logic");

    expect(resolveTimelineIsAtEnd({ isNearEnd: true, isAtEnd: false })).toBe(true);
    expect(resolveTimelineIsAtEnd({ isNearEnd: false, isAtEnd: true })).toBe(false);
    expect(resolveTimelineIsAtEnd({ isAtEnd: true })).toBe(true);
    expect(resolveTimelineIsAtEnd(undefined)).toBeUndefined();
    expect(
      resolveTimelineScrollThumb({
        contentLength: 2_000,
        scroll: 600,
        trackLength: 400,
        viewportLength: 800,
      }),
    ).toEqual({ length: 160, offset: 120 });
    expect(
      resolveTimelineScrollThumb({
        contentLength: 800,
        scroll: 0,
        trackLength: 400,
        viewportLength: 800,
      }),
    ).toBeNull();
  });

  it("renders a compact synced scroll indicator outside the native viewport", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[buildUserTimelineEntry("Scrollbar layout")]}
      />,
    );

    expect(markup).toContain('data-testid="timeline-scroll-indicator"');
    expect(markup).toContain("timeline-scroll-viewport");
    expect(markup).toContain("right:0");
    expect(markup).toContain('data-maintain-visible-content-position-size="true"');
    expect(markup).not.toContain("chat-end-rail-width");
    expect(markup).not.toContain("scrollbar-gutter-both");
    expect(markup).not.toContain("timeline-minimap");
  });

  it("renders active work as a full-width status separator", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        isWorking
        activeTurnInProgress
        activeTurnStartedAt={MESSAGE_CREATED_AT}
        timelineEntries={[]}
      />,
    );

    expect(markup).toContain('data-testid="working-status-separator"');
    expect(markup).toContain("border-b border-border/60");
    expect(markup).toContain("Working for ");
    expect(markup).not.toContain("animate-pulse");
  });

  it("anchors a sent attachment message using its measured height", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const onAnchorReady = vi.fn();
    const onAnchorSizeChanged = vi.fn();
    const firstEntry = buildUserTimelineEntry("First prompt.");
    const secondEntry = {
      ...buildUserTimelineEntry("Newest prompt."),
      id: "entry-2",
      message: {
        ...buildUserTimelineEntry("Newest prompt.").message,
        id: MessageId.make("message-2"),
        attachments: [
          {
            type: "image" as const,
            id: "attachment-1",
            name: "screenshot.png",
            mimeType: "image/png",
            sizeBytes: 1,
            previewUrl: "data:image/png;base64,iVBORw0KGgo=",
          },
        ],
      },
    };
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        anchorMessageId={secondEntry.message.id}
        onAnchorReady={onAnchorReady}
        onAnchorSizeChanged={onAnchorSizeChanged}
        contentInsetEndAdjustment={144}
        timelineEntries={[firstEntry, secondEntry]}
      />,
    );

    expect(markup).toContain('data-anchor-index="1"');
    expect(markup).toContain('data-anchor-offset="16"');
    expect(markup).toContain('data-anchor-on-ready="true"');
    expect(markup).not.toContain("data-anchor-max-size=");
    expect(markup).toContain('data-content-inset-end="144"');
    expect(markup).toContain("[overflow-anchor:none]");
    expect(markup).not.toContain('data-maintain-scroll-at-end="enabled"');
    expect(markup).toContain('data-maintain-visible-content-position="object"');
    expect(markup).toContain('data-maintain-visible-content-position-data="true"');
    expect(markup).toContain('data-maintain-visible-content-position-size="false"');
    expect(markup).not.toContain('data-source-highlight="true"');
    expect(onAnchorReady).toHaveBeenCalledOnce();
    expect(onAnchorReady).toHaveBeenCalledWith(secondEntry.message.id, 1);
    expect(onAnchorSizeChanged).toHaveBeenCalledWith(secondEntry.message.id, 240);
  });

  it("does not outline the entire message when opening a task source", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const entry = buildUserTimelineEntry("Task source prompt.");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        sourceHighlightMessageId={entry.message.id}
        timelineEntries={[entry]}
      />,
    );

    expect(markup).not.toContain('data-source-highlight="true"');
    expect(markup).not.toContain("ring-primary/45");
  });

  it("renders collapse controls for long user messages", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[buildUserTimelineEntry(buildLongUserMessageText())]}
      />,
    );

    expect(markup).toContain("Show full message");
    expect(markup).toContain('data-maintain-scroll-at-end="enabled"');
    expect(markup).toContain('data-maintain-scroll-at-end-animated="false"');
    expect(markup).toContain('data-maintain-scroll-at-end-data-change="true"');
    expect(markup).toContain('data-maintain-scroll-at-end-item-layout="true"');
    expect(markup).toContain('data-maintain-scroll-at-end-layout="true"');
    expect(markup).toContain('data-user-message-collapsed="true"');
    expect(markup).toContain('data-user-message-fade="true"');
    expect(markup).toContain('data-user-message-footer="true"');
  });

  it("does not render collapse controls for short user messages", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[buildUserTimelineEntry("Short prompt.")]}
      />,
    );

    expect(markup).not.toContain("Show full message");
    expect(markup).toContain('data-user-message-collapsible="false"');
  });

  it("renders inline terminal labels with the composer chip UI", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          buildUserTimelineEntry(
            [
              buildLongUserMessageText("yoo what's @terminal-1:1-5 mean"),
              "",
              "<terminal_context>",
              "- Terminal 1 lines 1-5:",
              "  1 | julius@mac effect-http-ws-cli % bun i",
              "  2 | bun install v1.3.9 (cf6cdbbb)",
              "</terminal_context>",
            ].join("\n"),
          ),
        ]}
      />,
    );

    expect(markup).toContain("Terminal 1 lines 1-5");
    expect(markup).toContain("lucide-terminal");
    expect(markup).toContain("yoo what&#x27;s</p>");
    expect(markup).toContain('<span aria-hidden="true"> </span>');
    expect(markup).toContain("Show full message");
  }, 20_000);

  it("renders chips for standalone element-pick context messages", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          buildUserTimelineEntry(
            [
              "<element_context>",
              "- <SubmitButton> (Button.tsx:12):",
              "  url: https://example.com/dashboard",
              "  selector: button.submit",
              "  source: /repo/src/Button.tsx:12:5",
              "  html:",
              '  <button class="submit">Save</button>',
              "</element_context>",
            ].join("\n"),
          ),
        ]}
      />,
    );

    expect(markup).toContain("SubmitButton");
    expect(markup).not.toContain("&lt;element_context");
    expect(markup).not.toContain("<element_context");
  });

  it("keeps the copy button for collapsed long user messages", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[buildUserTimelineEntry(buildLongUserMessageText())]}
      />,
    );

    expect(markup).toContain('aria-label="Copy link"');
    expect(markup).toContain('data-user-message-collapsed="true"');
    expect(markup).toContain('data-user-message-footer="true"');
  });

  it("renders context compaction entries in the normal work log", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-1",
            kind: "work",
            createdAt: "2026-03-17T19:12:28.000Z",
            entry: {
              id: "work-1",
              createdAt: "2026-03-17T19:12:28.000Z",
              label: "Context compacted",
              tone: "info",
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Context compacted");
    expect(markup).toContain("Work Log");
  });

  it("formats changed file paths from the workspace root", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-1",
            kind: "work",
            createdAt: "2026-03-17T19:12:28.000Z",
            entry: {
              id: "work-1",
              createdAt: "2026-03-17T19:12:28.000Z",
              label: "Updated files",
              tone: "tool",
              changedFiles: ["C:/Users/mike/dev-stuff/v12code/apps/web/src/session-logic.ts"],
            },
          },
        ]}
        workspaceRoot="C:/Users/mike/dev-stuff/v12code"
      />,
    );

    expect(markup).toContain("v12code/apps/web/src/session-logic.ts");
    expect(markup).not.toContain("C:/Users/mike/dev-stuff/v12code/apps/web/src/session-logic.ts");
  });

  it("renders compact command rows with status, duration, and exit metadata", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-command",
            kind: "work",
            createdAt: "2026-03-17T19:12:28.000Z",
            entry: {
              id: "work-command",
              createdAt: "2026-03-17T19:12:28.000Z",
              label: "Ran command",
              tone: "tool",
              itemType: "command_execution",
              command: "vp run typecheck",
              cwd: "/workspace/v12code",
              durationMs: 1_250,
              exitCode: 0,
              toolLifecycleStatus: "completed",
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("vp run typecheck");
    expect(markup).toContain("Succeeded");
    expect(markup).toContain("1.3s");
    expect(markup).toContain("exit 0");
    expect(markup).toContain('data-slot="collapsible"');
    expect(markup).toContain('aria-expanded="false"');
  });

  it("renders review comment contexts as structured cards instead of raw tags", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-1",
            kind: "message",
            createdAt: "2026-03-17T19:12:28.000Z",
            message: {
              id: MessageId.make("message-2"),
              role: "user",
              text: [
                '<review_comment sectionId="turn:2" sectionTitle="Turn 2" filePath="apps/web/src/lib/contextWindow.test.ts" startIndex="3" endIndex="14" rangeLabel="+47 to +58">',
                "Wadduo",
                "```diff",
                "@@ -0,0 +47,2 @@",
                '+  it("keeps valid zero-usage snapshots", () => {',
                "+    expect(snapshot).not.toBeNull();",
                "```",
                "</review_comment>",
              ].join("\n"),
              turnId: null,
              createdAt: "2026-03-17T19:12:28.000Z",
              updatedAt: "2026-03-17T19:12:28.000Z",
              streaming: false,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("contextWindow.test.ts");
    expect(markup).toContain("Wadduo");
    expect(markup).toContain('data-testid="file-diff"');
    expect(markup).not.toContain(">Review comment<");
    expect(markup).not.toContain("&lt;review_comment");
    expect(markup).not.toContain("&lt;/review_comment&gt;");
  });

  it("renders file review comments as source code instead of diffs", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-1",
            kind: "message",
            createdAt: "2026-03-17T19:12:28.000Z",
            message: {
              id: MessageId.make("message-source-comment"),
              role: "user",
              text: [
                '<review_comment sectionId="file:docs/plan.md" sectionTitle="File comment" filePath="docs/plan.md" startIndex="0" endIndex="1" rangeLabel="L1 to L2">',
                "Clarify this.",
                "```md",
                "# Plan",
                "- Step one",
                "```",
                "</review_comment>",
              ].join("\n"),
              turnId: null,
              createdAt: "2026-03-17T19:12:28.000Z",
              updatedAt: "2026-03-17T19:12:28.000Z",
              streaming: false,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("plan.md");
    expect(markup).toContain("Clarify this.");
    expect(markup).toContain("# Plan");
    expect(markup).not.toContain('data-testid="file-diff"');
  });

  it("renders a failure marker for failed tool lifecycle entries", async () => {
    const { MessagesTimeline } = await import("./MessagesTimeline");
    const markup = renderToStaticMarkup(
      <MessagesTimeline
        {...buildProps()}
        timelineEntries={[
          {
            id: "entry-1",
            kind: "work",
            createdAt: "2026-03-17T19:12:28.000Z",
            entry: {
              id: "work-1",
              createdAt: "2026-03-17T19:12:28.000Z",
              label: "Glob",
              tone: "tool",
              toolLifecycleStatus: "failed",
              detail: "No files found",
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("lucide-x");
    expect(markup).toContain('aria-label="Tool call failed"');
  });
});
