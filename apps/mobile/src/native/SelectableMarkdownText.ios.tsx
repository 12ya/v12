import {
  SelectableMarkdownText as V12CodeSelectableMarkdownText,
  type SelectableMarkdownTextProps,
} from "@v12code/mobile-markdown-text/renderer";

import { highlightCodeSnippet } from "../features/review/shikiReviewHighlighter";

type MobileSelectableMarkdownTextProps = Omit<SelectableMarkdownTextProps, "highlightCode">;

export type {
  NativeMarkdownTextStyle,
  SelectableMarkdownSkill,
} from "@v12code/mobile-markdown-text/types";

export function hasNativeSelectableMarkdownText(): boolean {
  return true;
}

export function SelectableMarkdownText(props: MobileSelectableMarkdownTextProps) {
  return <V12CodeSelectableMarkdownText {...props} highlightCode={highlightCodeSnippet} />;
}
