import {
  SelectableMarkdownText as V12SelectableMarkdownText,
  type SelectableMarkdownTextProps,
} from "@v12/mobile-markdown-text/renderer";

import { highlightCodeSnippet } from "../features/review/shikiReviewHighlighter";

type MobileSelectableMarkdownTextProps = Omit<SelectableMarkdownTextProps, "highlightCode">;

export type {
  NativeMarkdownTextStyle,
  SelectableMarkdownSkill,
} from "@v12/mobile-markdown-text/types";

export function hasNativeSelectableMarkdownText(): boolean {
  return true;
}

export function SelectableMarkdownText(props: MobileSelectableMarkdownTextProps) {
  return <V12SelectableMarkdownText {...props} highlightCode={highlightCodeSnippet} />;
}
