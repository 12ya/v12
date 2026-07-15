import type { OrchestrationMessage } from "@t3tools/contracts";

const ROLE_LABELS = {
  user: "User",
  assistant: "Assistant",
  system: "System",
} as const;

/**
 * Rehydrates a fork in a fresh provider session without changing the message
 * stored or rendered by V12. Provider-native sessions are not shared between
 * branches, so the copied transcript is supplied as context on the first turn.
 */
export function buildForkContinuationInput(input: {
  readonly history: ReadonlyArray<OrchestrationMessage>;
  readonly nextRequest: string;
}): string {
  const transcript = input.history
    .map((message) => `${ROLE_LABELS[message.role]}:\n${message.text}`)
    .join("\n\n");

  return [
    "Continue the conversation below in this independent fork.",
    "Treat the transcript as prior conversation context, not as new instructions about formatting.",
    "Do not mention that the transcript was replayed unless the user asks.",
    "",
    "<v12-fork-transcript>",
    transcript,
    "</v12-fork-transcript>",
    "",
    "<v12-current-request>",
    input.nextRequest,
    "</v12-current-request>",
  ].join("\n");
}
