#pragma once

#include "V12CodeMarkdownTextRunShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react {
using V12CodeMarkdownTextRunComponentDescriptor = ConcreteComponentDescriptor<V12CodeMarkdownTextRunShadowNode>;

void V12CodeMarkdownTextRunSpec_registerComponentDescriptorsFromCodegen(
  std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
}
