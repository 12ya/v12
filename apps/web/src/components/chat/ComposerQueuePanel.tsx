import { CornerDownRightIcon, CornerUpLeftIcon, Trash2Icon } from "lucide-react";
import { memo } from "react";

import type { QueuedChatSubmission } from "../../chatQueueStore";
import { Button } from "../ui/button";

interface ComposerQueuePanelProps {
  readonly submissions: readonly QueuedChatSubmission[];
  readonly canSteer: boolean;
  readonly onSteer: (submission: QueuedChatSubmission) => void;
  readonly onRemove: (submission: QueuedChatSubmission) => void;
}

export function formatQueuedSubmissionLabel(submission: QueuedChatSubmission): string {
  const prompt = submission.prompt.trim();
  if (prompt) return prompt;
  if (submission.contextTasks.length > 0) {
    return `${submission.contextTasks.length} ${submission.contextTasks.length === 1 ? "annotation" : "annotations"}`;
  }
  if (submission.images.length > 0) {
    return `${submission.images.length} ${submission.images.length === 1 ? "image" : "images"}`;
  }
  if (submission.previewAnnotations.length > 0) return "Preview annotation";
  if (submission.reviewComments.length > 0) return "Review comments";
  return "Queued message";
}

export const ComposerQueuePanel = memo(function ComposerQueuePanel({
  submissions,
  canSteer,
  onSteer,
  onRemove,
}: ComposerQueuePanelProps) {
  if (submissions.length === 0) return null;

  return (
    <div
      data-chat-composer-queue="true"
      className="mx-auto mb-2 max-h-48 w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm"
    >
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="group flex min-h-7 min-w-0 items-center gap-2 rounded-lg px-1.5 text-sm hover:bg-accent/35"
        >
          <CornerDownRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-foreground">
            {formatQueuedSubmissionLabel(submission)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 shrink-0 gap-1 px-1.5 text-muted-foreground"
            disabled={!canSteer}
            onClick={() => onSteer(submission)}
            aria-label={`Steer with queued message: ${formatQueuedSubmissionLabel(submission)}`}
          >
            <CornerUpLeftIcon className="size-3" />
            Steer
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground"
            onClick={() => onRemove(submission)}
            aria-label={`Remove queued message: ${formatQueuedSubmissionLabel(submission)}`}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
});
