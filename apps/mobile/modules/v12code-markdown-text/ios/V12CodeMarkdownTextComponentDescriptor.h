#pragma once

#include "V12CodeMarkdownTextShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react {
using V12CodeMarkdownTextComponentDescriptor = ConcreteComponentDescriptor<V12CodeMarkdownTextShadowNode>;

void V12CodeMarkdownTextSpec_registerComponentDescriptorsFromCodegen(
  std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
}
