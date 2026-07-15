import type { ThreadId } from "@t3tools/contracts";
import { GitForkIcon } from "lucide-react";
import { memo } from "react";

import { Button } from "./ui/button";

export const ThreadForkBreadcrumb = memo(function ThreadForkBreadcrumb({
  parentThreadId,
  onOpenParent,
}: {
  readonly parentThreadId: ThreadId | null | undefined;
  readonly onOpenParent: (threadId: ThreadId) => void;
}) {
  if (!parentThreadId) return null;

  return (
    <div className="flex h-7 shrink-0 items-center gap-2 border-b border-border/60 bg-muted/15 px-3 text-xs text-muted-foreground sm:px-5">
      <GitForkIcon className="size-3.5" aria-hidden />
      <span>Forked from another chat</span>
      <Button
        type="button"
        size="xs"
        variant="link"
        className="h-auto p-0 text-xs"
        onClick={() => onOpenParent(parentThreadId)}
      >
        Open parent
      </Button>
    </div>
  );
});
