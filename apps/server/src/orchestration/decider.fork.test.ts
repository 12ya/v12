import * as NodeServices from "@effect/platform-node/NodeServices";
import {
  CommandId,
  EventId,
  MessageId,
  ProjectId,
  ProviderInstanceId,
  ThreadId,
  TurnId,
  type OrchestrationEvent,
  type OrchestrationReadModel,
} from "@v12/contracts";
import { expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import { decideOrchestrationCommand } from "./decider.ts";
import { projectEvent } from "./projector.ts";

const createdAt = "2026-07-15T00:00:00.000Z";
const sourceThreadId = ThreadId.make("thread-source");
const targetThreadId = ThreadId.make("thread-fork");
const selectedMessageId = MessageId.make("message-assistant-1");
const turnId = TurnId.make("turn-1");

const readModel: OrchestrationReadModel = {
  snapshotSequence: 1,
  updatedAt: createdAt,
  projects: [
    {
      id: ProjectId.make("project-1"),
      title: "Project",
      workspaceRoot: "/tmp/project",
      defaultModelSelection: null,
      scripts: [],
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    },
  ],
  threads: [
    {
      id: sourceThreadId,
      projectId: ProjectId.make("project-1"),
      title: "Source",
      modelSelection: {
        instanceId: ProviderInstanceId.make("codex"),
        model: "gpt-5-codex",
      },
      runtimeMode: "full-access",
      interactionMode: "default",
      branch: "main",
      worktreePath: null,
      latestTurn: null,
      createdAt,
      updatedAt: "2026-07-15T00:00:04.000Z",
      archivedAt: null,
      deletedAt: null,
      messages: [
        {
          id: MessageId.make("message-user-1"),
          role: "user",
          text: "First question",
          attachments: [],
          turnId: null,
          streaming: false,
          createdAt: "2026-07-15T00:00:01.000Z",
          updatedAt: "2026-07-15T00:00:01.000Z",
        },
        {
          id: selectedMessageId,
          role: "assistant",
          text: "First answer",
          turnId,
          streaming: false,
          createdAt: "2026-07-15T00:00:02.000Z",
          updatedAt: "2026-07-15T00:00:02.000Z",
        },
        {
          id: MessageId.make("message-user-2"),
          role: "user",
          text: "Future question",
          attachments: [],
          turnId: null,
          streaming: false,
          createdAt: "2026-07-15T00:00:03.000Z",
          updatedAt: "2026-07-15T00:00:03.000Z",
        },
      ],
      proposedPlans: [],
      activities: [
        {
          id: EventId.make("activity-before"),
          tone: "tool",
          kind: "tool.completed",
          summary: "Read a file",
          payload: {},
          turnId,
          sequence: 1,
          createdAt: "2026-07-15T00:00:01.500Z",
        },
        {
          id: EventId.make("activity-after"),
          tone: "tool",
          kind: "tool.completed",
          summary: "Future work",
          payload: {},
          turnId: TurnId.make("turn-2"),
          sequence: 2,
          createdAt: "2026-07-15T00:00:03.500Z",
        },
      ],
      checkpoints: [],
      session: null,
    },
  ],
};

type PlannedEvent = OrchestrationEvent extends infer Event
  ? Event extends OrchestrationEvent
    ? Omit<Event, "sequence">
    : never
  : never;

it.layer(NodeServices.layer)("thread fork decider", (it) => {
  it.effect("creates a child thread without copying parent history", () =>
    Effect.gen(function* () {
      const result = yield* decideOrchestrationCommand({
        command: {
          type: "thread.create",
          commandId: CommandId.make("command-create-child"),
          threadId: targetThreadId,
          projectId: ProjectId.make("project-1"),
          title: "Background child",
          modelSelection: {
            instanceId: ProviderInstanceId.make("codex"),
            model: "gpt-5-codex",
          },
          runtimeMode: "full-access",
          interactionMode: "default",
          branch: "v12/background-child",
          worktreePath: "/tmp/background-child",
          parentThreadId: sourceThreadId,
          createdAt: "2026-07-15T00:01:00.000Z",
        },
        readModel,
      });

      const events: ReadonlyArray<PlannedEvent> = Array.isArray(result)
        ? result
        : [result as PlannedEvent];
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("thread.created");
      if (events[0]?.type !== "thread.created") return;
      expect(events[0].payload).toMatchObject({
        threadId: targetThreadId,
        parentThreadId: sourceThreadId,
        forkedFromMessageId: null,
      });
    }),
  );

  it.effect("rejects child threads whose parent belongs to another project", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        decideOrchestrationCommand({
          command: {
            type: "thread.create",
            commandId: CommandId.make("command-create-cross-project-child"),
            threadId: targetThreadId,
            projectId: ProjectId.make("project-other"),
            title: "Invalid child",
            modelSelection: {
              instanceId: ProviderInstanceId.make("codex"),
              model: "gpt-5-codex",
            },
            runtimeMode: "full-access",
            interactionMode: "default",
            branch: null,
            worktreePath: null,
            parentThreadId: sourceThreadId,
            createdAt: "2026-07-15T00:01:00.000Z",
          },
          readModel: {
            ...readModel,
            projects: [
              ...readModel.projects,
              {
                ...readModel.projects[0]!,
                id: ProjectId.make("project-other"),
                workspaceRoot: "/tmp/project-other",
              },
            ],
          },
        }),
      );
      expect(error.message).toContain("belongs to project");
    }),
  );

  it.effect("atomically copies only the selected history prefix with new identities", () =>
    Effect.gen(function* () {
      const result = yield* decideOrchestrationCommand({
        command: {
          type: "thread.fork",
          commandId: CommandId.make("command-fork"),
          threadId: targetThreadId,
          sourceThreadId,
          throughMessageId: selectedMessageId,
          createdAt: "2026-07-15T00:01:00.000Z",
        },
        readModel,
      });
      const events: ReadonlyArray<PlannedEvent> = Array.isArray(result) ? result : [result];

      expect(events.map((event) => event.type)).toEqual([
        "thread.created",
        "thread.message-sent",
        "thread.message-sent",
        "thread.activity-appended",
      ]);

      let projected = readModel;
      for (const [index, event] of events.entries()) {
        projected = yield* projectEvent(projected, {
          ...event,
          sequence: readModel.snapshotSequence + index + 1,
        });
      }

      const fork = projected.threads.find((thread) => thread.id === targetThreadId);
      expect(fork).toMatchObject({
        parentThreadId: sourceThreadId,
        forkedFromMessageId: selectedMessageId,
        title: "Source (fork)",
        branch: "main",
      });
      expect(fork?.messages.map((message) => message.text)).toEqual([
        "First question",
        "First answer",
      ]);
      expect(fork?.messages.map((message) => message.id)).not.toEqual(
        readModel.threads[0]?.messages.slice(0, 2).map((message) => message.id),
      );
      expect(fork?.activities.map((activity) => activity.summary)).toEqual(["Read a file"]);
      expect(fork?.activities[0]?.id).not.toBe(EventId.make("activity-before"));
    }),
  );

  it.effect("rejects a streaming fork point", () =>
    Effect.gen(function* () {
      const streamingReadModel: OrchestrationReadModel = {
        ...readModel,
        threads: [
          {
            ...readModel.threads[0]!,
            messages: readModel.threads[0]!.messages.map((message) =>
              message.id === selectedMessageId ? { ...message, streaming: true } : message,
            ),
          },
        ],
      };
      const error = yield* Effect.flip(
        decideOrchestrationCommand({
          command: {
            type: "thread.fork",
            commandId: CommandId.make("command-fork-streaming"),
            threadId: targetThreadId,
            sourceThreadId,
            throughMessageId: selectedMessageId,
            createdAt: "2026-07-15T00:01:00.000Z",
          },
          readModel: streamingReadModel,
        }),
      );
      expect(error.message).toContain("still streaming");
    }),
  );
});
