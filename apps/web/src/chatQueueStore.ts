import type {
  EnvironmentId,
  MessageId,
  ModelSelection,
  PreviewAnnotationPayload,
  ProviderDriverKind,
  ProviderInteractionMode,
  RuntimeMode,
  ServerProvider,
  ThreadId,
} from "@v12/contracts";
import { create } from "zustand";

import type { ComposerImageAttachment } from "./composerDraftStore";
import type { ElementContextDraft } from "./lib/elementContext";
import type { TerminalContextDraft } from "./lib/terminalContext";
import type { ReviewCommentContext } from "./reviewCommentContext";
import type { ContextualTask } from "./taskHudState";

/** A composer snapshot waiting for the current turn to finish. */
export interface QueuedChatSubmission {
  readonly id: MessageId;
  readonly threadKey: string;
  readonly environmentId: EnvironmentId;
  readonly threadId: ThreadId;
  readonly createdAt: string;
  readonly prompt: string;
  readonly images: readonly ComposerImageAttachment[];
  readonly terminalContexts: readonly TerminalContextDraft[];
  readonly elementContexts: readonly ElementContextDraft[];
  readonly previewAnnotations: readonly PreviewAnnotationPayload[];
  readonly reviewComments: readonly ReviewCommentContext[];
  readonly contextTasks: readonly ContextualTask[];
  readonly selectedProvider: ProviderDriverKind;
  readonly selectedModel: string;
  readonly selectedProviderModels: ReadonlyArray<ServerProvider["models"][number]>;
  readonly selectedPromptEffort: string | null;
  readonly selectedModelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
  readonly interactionMode: ProviderInteractionMode;
}

interface ChatQueueState {
  readonly queuesByThreadKey: Readonly<Record<string, readonly QueuedChatSubmission[]>>;
  readonly enqueue: (submission: QueuedChatSubmission) => void;
  readonly remove: (threadKey: string, submissionId: MessageId) => void;
  readonly clearThread: (threadKey: string) => void;
}

export function shouldEnqueueChatSubmission(input: {
  readonly isQueuedDelivery: boolean;
  readonly hasActiveTurn: boolean;
  readonly hasPendingDispatch: boolean;
  readonly hasQueuedSubmissions: boolean;
}): boolean {
  return (
    !input.isQueuedDelivery &&
    (input.hasActiveTurn || input.hasPendingDispatch || input.hasQueuedSubmissions)
  );
}

export const useChatQueueStore = create<ChatQueueState>()((set) => ({
  queuesByThreadKey: {},
  enqueue: (submission) =>
    set((state) => ({
      queuesByThreadKey: {
        ...state.queuesByThreadKey,
        [submission.threadKey]: [
          ...(state.queuesByThreadKey[submission.threadKey] ?? []),
          submission,
        ],
      },
    })),
  remove: (threadKey, submissionId) =>
    set((state) => {
      const current = state.queuesByThreadKey[threadKey] ?? [];
      const next = current.filter((submission) => submission.id !== submissionId);
      if (next.length === current.length) return state;
      const queuesByThreadKey = { ...state.queuesByThreadKey };
      if (next.length === 0) delete queuesByThreadKey[threadKey];
      else queuesByThreadKey[threadKey] = next;
      return { queuesByThreadKey };
    }),
  clearThread: (threadKey) =>
    set((state) => {
      if (!(threadKey in state.queuesByThreadKey)) return state;
      const queuesByThreadKey = { ...state.queuesByThreadKey };
      delete queuesByThreadKey[threadKey];
      return { queuesByThreadKey };
    }),
}));
