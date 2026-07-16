#pragma once

#include <react/renderer/components/V12CodeMarkdownTextSpec/EventEmitters.h>
#include <react/renderer/components/V12CodeMarkdownTextSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNode.h>

#include <string>
#include <vector>

namespace facebook::react {

extern const char V12CodeMarkdownTextComponentName[];

struct V12CodeMarkdownTextParagraphStyleRange {
  size_t location;
  size_t length;
  Float firstLineHeadIndent;
  Float headIndent;
  Float paragraphSpacing;
};

struct V12CodeMarkdownTextAttachmentRange {
  size_t location;
  size_t length;
  std::string imageUri;
};

inline Float V12CodeMarkdownTextAttachmentSize(const V12CodeMarkdownTextAttachmentRange &) {
  return 14;
}

inline Float V12CodeMarkdownTextAttachmentBaselineOffset(
    const V12CodeMarkdownTextAttachmentRange &) {
  return -2;
}

class V12CodeMarkdownTextStateReal final {
 public:
  AttributedString attributedString;
  std::vector<V12CodeMarkdownTextParagraphStyleRange> paragraphStyleRanges;
  std::vector<V12CodeMarkdownTextAttachmentRange> attachmentRanges;
};

class V12CodeMarkdownTextShadowNode final : public ConcreteViewShadowNode<
V12CodeMarkdownTextComponentName,
V12CodeMarkdownTextProps,
V12CodeMarkdownTextEventEmitter,
V12CodeMarkdownTextStateReal> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  V12CodeMarkdownTextShadowNode(
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
  mutable std::vector<V12CodeMarkdownTextParagraphStyleRange> _paragraphStyleRanges;
  mutable std::vector<V12CodeMarkdownTextAttachmentRange> _attachmentRanges;
};
} // namespace facebook::React
