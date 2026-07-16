import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { ComposerPrimaryActions, formatPendingPrimaryActionLabel } from "./ComposerPrimaryActions";

describe("formatPendingPrimaryActionLabel", () => {
  it("returns 'Submitting...' while responding", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: false,
        isLastQuestion: false,
        isResponding: true,
        questionIndex: 0,
      }),
    ).toBe("Submitting...");
  });

  it("returns 'Submitting...' while responding regardless of other flags", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: true,
        isLastQuestion: true,
        isResponding: true,
        questionIndex: 3,
      }),
    ).toBe("Submitting...");
  });

  it("returns 'Submit' in compact mode on the last question", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: true,
        isLastQuestion: true,
        isResponding: false,
        questionIndex: 0,
      }),
    ).toBe("Submit");
  });

  it("returns 'Next' in compact mode when not the last question", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: true,
        isLastQuestion: false,
        isResponding: false,
        questionIndex: 1,
      }),
    ).toBe("Next");
  });

  it("returns 'Next question' when not the last question", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: false,
        isLastQuestion: false,
        isResponding: false,
        questionIndex: 0,
      }),
    ).toBe("Next question");
  });

  it("returns singular 'Submit answer' on the last question when it is the only question", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: false,
        isLastQuestion: true,
        isResponding: false,
        questionIndex: 0,
      }),
    ).toBe("Submit answer");
  });

  it("returns plural 'Submit answers' on the last question when there are multiple questions", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: false,
        isLastQuestion: true,
        isResponding: false,
        questionIndex: 1,
      }),
    ).toBe("Submit answers");
  });

  it("returns plural 'Submit answers' for higher question indices", () => {
    expect(
      formatPendingPrimaryActionLabel({
        compact: false,
        isLastQuestion: true,
        isResponding: false,
        questionIndex: 5,
      }),
    ).toBe("Submit answers");
  });
});

describe("ComposerPrimaryActions", () => {
  it("shows queue and stop actions while a run is active and a draft is ready", () => {
    const markup = renderToStaticMarkup(
      createElement(ComposerPrimaryActions, {
        compact: false,
        pendingAction: null,
        isRunning: true,
        showPlanFollowUpPrompt: false,
        promptHasText: true,
        isSendBusy: false,
        isConnecting: false,
        isEnvironmentUnavailable: false,
        isPreparingWorktree: false,
        hasSendableContent: true,
        onPreviousPendingQuestion: () => {},
        onInterrupt: () => {},
        onImplementPlanInNewThread: () => {},
      }),
    );

    expect(markup).toContain("Queue message behind the active run");
    expect(markup).toContain("Stop generation");
  });

  it("keeps send enabled while the previous send is starting", () => {
    const markup = renderToStaticMarkup(
      createElement(ComposerPrimaryActions, {
        compact: false,
        pendingAction: null,
        isRunning: false,
        showPlanFollowUpPrompt: false,
        promptHasText: true,
        isSendBusy: true,
        isConnecting: false,
        isEnvironmentUnavailable: false,
        isPreparingWorktree: false,
        hasSendableContent: true,
        onPreviousPendingQuestion: () => {},
        onInterrupt: () => {},
        onImplementPlanInNewThread: () => {},
      }),
    );

    expect(markup).toContain('aria-label="Queue message behind the pending send"');
    expect(markup).not.toMatch(/<button[^>]*\sdisabled(?:=|\s|>)/);
  });
});
