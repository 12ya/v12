import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import type { QueuedChatSubmission } from "../../chatQueueStore";
import { ComposerQueuePanel, formatQueuedSubmissionLabel } from "./ComposerQueuePanel";

function submission(prompt: string): QueuedChatSubmission {
  return {
    id: prompt as never,
    threadKey: "thread",
    environmentId: "environment" as never,
    threadId: "thread" as never,
    createdAt: "2026-07-17T00:00:00.000Z",
    prompt,
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

describe("ComposerQueuePanel", () => {
  it("renders queued prompts above the composer with steer and remove actions", () => {
    const markup = renderToStaticMarkup(
      createElement(ComposerQueuePanel, {
        submissions: [submission("first follow-up"), submission("second follow-up")],
        canSteer: true,
        onSteer: () => {},
        onRemove: () => {},
      }),
    );

    expect(markup).toContain('data-chat-composer-queue="true"');
    expect(markup).toContain("mx-auto");
    expect(markup).toContain("max-w-3xl");
    expect(markup).toContain("first follow-up");
    expect(markup).toContain("second follow-up");
    expect(markup).toContain("Steer");
    expect(markup).toContain("Remove queued message");
  });

  it("uses attachment context when the prompt is empty", () => {
    const queued = {
      ...submission(""),
      contextTasks: [{ id: "annotation" }, { id: "annotation-2" }],
    } as never;
    expect(formatQueuedSubmissionLabel(queued)).toBe("2 annotations");
  });
});
