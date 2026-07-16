#pragma once

#include "V12MarkdownTextRunShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react {
using V12MarkdownTextRunComponentDescriptor = ConcreteComponentDescriptor<V12MarkdownTextRunShadowNode>;

void V12MarkdownTextRunSpec_registerComponentDescriptorsFromCodegen(
  std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
}
