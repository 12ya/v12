#pragma once

#include <react/renderer/components/V12MarkdownTextSpec/EventEmitters.h>
#include <react/renderer/components/V12MarkdownTextSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNode.h>

#include <string>
#include <vector>

namespace facebook::react {

extern const char V12MarkdownTextComponentName[];

struct V12MarkdownTextParagraphStyleRange {
  size_t location;
  size_t length;
  Float firstLineHeadIndent;
  Float headIndent;
  Float paragraphSpacing;
};

struct V12MarkdownTextAttachmentRange {
  size_t location;
  size_t length;
  std::string imageUri;
};

inline Float V12MarkdownTextAttachmentSize(const V12MarkdownTextAttachmentRange &) {
  return 14;
}

inline Float V12MarkdownTextAttachmentBaselineOffset(
    const V12MarkdownTextAttachmentRange &) {
  return -2;
}

class V12MarkdownTextStateReal final {
 public:
  AttributedString attributedString;
  std::vector<V12MarkdownTextParagraphStyleRange> paragraphStyleRanges;
  std::vector<V12MarkdownTextAttachmentRange> attachmentRanges;
};

class V12MarkdownTextShadowNode final : public ConcreteViewShadowNode<
V12MarkdownTextComponentName,
V12MarkdownTextProps,
V12MarkdownTextEventEmitter,
V12MarkdownTextStateReal> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  V12MarkdownTextShadowNode(
   const ShadowNode& sourceShadowNode,
   const ShadowNodeFragment& fragment
  );

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  void layout(LayoutContext layoutContext) override;

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

private:
  mutable AttributedString _attributedString;
  mutable std::vector<V12MarkdownTextParagraphStyleRange> _paragraphStyleRanges;
  mutable std::vector<V12MarkdownTextAttachmentRange> _attachmentRanges;
};
} // namespace facebook::React
