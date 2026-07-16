import {
  CommandId,
  EnvironmentId,
  MessageId,
  ORCHESTRATION_WS_METHODS,
  ProjectId,
  ProviderInstanceId,
  ThreadId,
  type ClientOrchestrationCommand,
} from "@v12code/contracts";
import { describe, expect, it } from "@effect/vitest";
import * as Crypto from "effect/Crypto";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as SubscriptionRef from "effect/SubscriptionRef";

import {
  AVAILABLE_CONNECTION_STATE,
  PrimaryConnectionTarget,
  type PreparedConnection,
} from "../connection/model.ts";
import * as EnvironmentSupervisor from "../connection/supervisor.ts";
import * as RpcSession from "../rpc/session.ts";
import type { WsRpcProtocolClient } from "../rpc/protocol.ts";
import {
  archiveThread,
  createProject,
  startLocalMultitask,
  stopThreadSession,
} from "./commands.ts";

const TEST_CRYPTO_LAYER = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) => new Uint8Array(size),
    digest: (_algorithm, data) => Effect.succeed(data),
  }),
);

const TARGET = new PrimaryConnectionTarget({
  environmentId: EnvironmentId.make("environment-1"),
  label: "Test environment",
  httpBaseUrl: "https://environment.example.test",
  wsBaseUrl: "wss://environment.example.test",
});

const makeSupervisor = Effect.fn("TestEnvironmentCommands.makeSupervisor")(function* (
  dispatched: ClientOrchestrationCommand[],
  dispatchOverride?: (
    command: ClientOrchestrationCommand,
  ) => Effect.Effect<{ readonly sequence: number }>,
) {
  const client = {
    [ORCHESTRATION_WS_METHODS.dispatchCommand]: (command: ClientOrchestrationCommand) =>
      dispatchOverride?.(command) ??
      Effect.sync(() => {
        dispatched.push(command);
        return { sequence: dispatched.length };
      }),
  } as unknown as WsRpcProtocolClient;
  const session: RpcSession.RpcSession = {
    client,
    initialConfig: Effect.never,
    ready: Effect.void,
    probe: Effect.void,
    closed: Effect.never,
  };
  return EnvironmentSupervisor.EnvironmentSupervisor.of({
    target: TARGET,
    state: yield* SubscriptionRef.make(AVAILABLE_CONNECTION_STATE),
    session: yield* SubscriptionRef.make(Option.some(session)),
    prepared: yield* SubscriptionRef.make(Option.none<PreparedConnection>()),
    connect: Effect.void,
    disconnect: Effect.void,
    retryNow: Effect.void,
  } satisfies EnvironmentSupervisor.EnvironmentSupervisor["Service"]);
});

describe("environment commands", () => {
  it.effect("adds generated command metadata", () =>
    Effect.gen(function* () {
      const dispatched: ClientOrchestrationCommand[] = [];
      const supervisor = yield* makeSupervisor(dispatched);

      const result = yield* createProject({
        projectId: ProjectId.make("project-1"),
        title: "Project",
        workspaceRoot: "/workspace/project",
        createdAt: "2026-06-06T00:00:00.000Z",
      }).pipe(Effect.provideService(EnvironmentSupervisor.EnvironmentSupervisor, supervisor));

      expect(result).toEqual({ sequence: 1 });
      expect(dispatched).toEqual([
        {
          type: "project.create",
          commandId: "00000000-0000-4000-8000-000000000000",
          projectId: "project-1",
          title: "Project",
          workspaceRoot: "/workspace/project",
          createdAt: "2026-06-06T00:00:00.000Z",
        },
      ]);
    }).pipe(Effect.provide(TEST_CRYPTO_LAYER)),
  );

  it.effect("preserves caller metadata for idempotent queued commands", () =>
    Effect.gen(function* () {
      const dispatched: ClientOrchestrationCommand[] = [];
      const supervisor = yield* makeSupervisor(dispatched);

      yield* stopThreadSession({
        commandId: CommandId.make("queued-command"),
        threadId: ThreadId.make("thread-1"),
        createdAt: "2026-06-06T00:01:00.000Z",
      }).pipe(Effect.provideService(EnvironmentSupervisor.EnvironmentSupervisor, supervisor));

      expect(dispatched).toEqual([
        {
          type: "thread.session.stop",
          commandId: "queued-command",
          threadId: "thread-1",
          createdAt: "2026-06-06T00:01:00.000Z",
        },
      ]);
    }).pipe(Effect.provide(TEST_CRYPTO_LAYER)),
  );

  it.effect("does not add timestamps to commands without createdAt", () =>
    Effect.gen(function* () {
      const dispatched: ClientOrchestrationCommand[] = [];
      const supervisor = yield* makeSupervisor(dispatched);

      yield* archiveThread({
        commandId: CommandId.make("archive-command"),
        threadId: ThreadId.make("thread-1"),
      }).pipe(Effect.provideService(EnvironmentSupervisor.EnvironmentSupervisor, supervisor));

      expect(dispatched).toEqual([
        {
          type: "thread.archive",
          commandId: "archive-command",
          threadId: "thread-1",
        },
      ]);
    }).pipe(Effect.provide(TEST_CRYPTO_LAYER)),
  );

  it.effect("starts local child turns with bounded concurrency", () =>
    Effect.gen(function* () {
      const dispatched: ClientOrchestrationCommand[] = [];
      const twoStarted = yield* Deferred.make<void>();
      let active = 0;
      let maxActive = 0;
      const supervisor = yield* makeSupervisor(dispatched, (command) =>
        Effect.gen(function* () {
          dispatched.push(command);
          active += 1;
          maxActive = Math.max(maxActive, active);
          if (active === 2) yield* Deferred.succeed(twoStarted, undefined);
          yield* Deferred.await(twoStarted);
          yield* Effect.yieldNow;
          active -= 1;
          return { sequence: dispatched.length };
        }),
      );
      const parentThreadId = ThreadId.make("thread-parent");
      const modelSelection = {
        instanceId: ProviderInstanceId.make("codex"),
        model: "gpt-5-codex",
      };
      const turns = [1, 2, 3, 4].map((index) => ({
        commandId: CommandId.make(`command-child-${index}`),
        threadId: ThreadId.make(`thread-child-${index}`),
        message: {
          messageId: MessageId.make(`message-child-${index}`),
          role: "user" as const,
          text: `Task ${index}`,
          attachments: [],
        },
        runtimeMode: "full-access" as const,
        interactionMode: "default" as const,
        bootstrap: {
          createThread: {
            projectId: ProjectId.make("project-1"),
            title: `Child ${index}`,
            modelSelection,
            runtimeMode: "full-access" as const,
            interactionMode: "default" as const,
            branch: "main",
            worktreePath: null,
            parentThreadId,
            createdAt: "2026-06-06T00:00:00.000Z",
          },
          prepareWorktree: {
            projectCwd: "/workspace/project",
            baseBranch: "main",
            branch: `v12code/child-${index}`,
          },
        },
        createdAt: "2026-06-06T00:00:00.000Z",
      }));

      const result = yield* startLocalMultitask({
        turns,
        maxConcurrency: 2,
      }).pipe(Effect.provideService(EnvironmentSupervisor.EnvironmentSupervisor, supervisor));

      expect(maxActive).toBe(2);
      expect(result.map((entry) => entry.status)).toEqual([
        "started",
        "started",
        "started",
        "started",
      ]);
      expect(
        dispatched.map(
          (command) =>
            command.type === "thread.turn.start" && command.bootstrap?.createThread?.parentThreadId,
        ),
      ).toEqual([parentThreadId, parentThreadId, parentThreadId, parentThreadId]);
    }).pipe(Effect.provide(TEST_CRYPTO_LAYER)),
  );
});
