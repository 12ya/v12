import { MessageId, type OrchestrationMessage } from "@v12/contracts";
import { describe, expect, it } from "@effect/vitest";

import { buildForkContinuationInput } from "./forkContinuation.ts";

const message = (
  id: string,
  role: OrchestrationMessage["role"],
  text: string,
): OrchestrationMessage => ({
  id: MessageId.make(id),
  role,
  text,
  turnId: null,
  streaming: false,
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
});

describe("buildForkContinuationInput", () => {
  it("separates copied history from the new request", () => {
    const result = buildForkContinuationInput({
      history: [
        message("user-1", "user", "Inspect it"),
        message("assistant-1", "assistant", "Done"),
      ],
      nextRequest: "Now fix it",
    });

    expect(result).toContain("User:\nInspect it\n\nAssistant:\nDone");
    expect(result).toContain("<v12-current-request>\nNow fix it\n</v12-current-request>");
  });
});
