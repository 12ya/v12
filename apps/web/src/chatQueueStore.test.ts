import { beforeEach, describe, expect, it } from "vite-plus/test";

import {
  shouldEnqueueChatSubmission,
  useChatQueueStore,
  type QueuedChatSubmission,
} from "./chatQueueStore";

function submission(id: string, threadKey: string): QueuedChatSubmission {
  return {
    id: id as never,
    threadKey,
    environmentId: "env" as never,
    threadId: threadKey as never,
    createdAt: `2026-07-17T00:00:0${id}.000Z`,
    prompt: id,
    images: [],
    terminalContexts: [],
    elementContexts: [],
    previewAnnotations: [],
    reviewComments: [],
    contextTasks: [],
    selectedProvider: "codex" as never,
    selectedModel: "gpt-test",
    selectedProviderModels: [],
    selectedPromptEffort: null,
    selectedModelSelection: { instanceId: "codex", model: "gpt-test" } as never,
    runtimeMode: "full-access",
    interactionMode: "default",
  };
}

beforeEach(() => {
  useChatQueueStore.setState({ queuesByThreadKey: {} });
});

describe("chat queue store", () => {
  it("keeps FIFO order per thread", () => {
    const store = useChatQueueStore.getState();
    store.enqueue(submission("1", "thread-a"));
    store.enqueue(submission("2", "thread-a"));

    expect(
      useChatQueueStore.getState().queuesByThreadKey["thread-a"]?.map((item) => item.id),
    ).toEqual(["1", "2"]);

    useChatQueueStore.getState().remove("thread-a", "1" as never);
    expect(useChatQueueStore.getState().queuesByThreadKey["thread-a"]?.[0]?.id).toBe("2");
  });

  it("keeps queues isolated by thread", () => {
    const store = useChatQueueStore.getState();
    store.enqueue(submission("1", "thread-a"));
    store.enqueue(submission("2", "thread-b"));
    store.clearThread("thread-a");

    expect(useChatQueueStore.getState().queuesByThreadKey["thread-a"]).toBeUndefined();
    expect(useChatQueueStore.getState().queuesByThreadKey["thread-b"]?.[0]?.id).toBe("2");
  });
});

describe("shouldEnqueueChatSubmission", () => {
  it("queues immediately while the previous send is still starting", () => {
    expect(
      shouldEnqueueChatSubmission({
        isQueuedDelivery: false,
        hasActiveTurn: false,
        hasPendingDispatch: true,
        hasQueuedSubmissions: false,
      }),
    ).toBe(true);
  });

  it("does not enqueue a queued delivery again", () => {
    expect(
      shouldEnqueueChatSubmission({
        isQueuedDelivery: true,
        hasActiveTurn: true,
        hasPendingDispatch: true,
        hasQueuedSubmissions: true,
      }),
    ).toBe(false);
  });
});
