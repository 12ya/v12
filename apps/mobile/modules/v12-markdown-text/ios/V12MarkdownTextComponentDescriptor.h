#pragma once

#include "V12MarkdownTextShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react {
using V12MarkdownTextComponentDescriptor = ConcreteComponentDescriptor<V12MarkdownTextShadowNode>;

void V12MarkdownTextSpec_registerComponentDescriptorsFromCodegen(
  std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
}
