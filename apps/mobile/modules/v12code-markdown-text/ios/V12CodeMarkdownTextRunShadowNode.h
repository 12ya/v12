#pragma once

#include <react/renderer/components/V12CodeMarkdownTextSpec/EventEmitters.h>
#include <react/renderer/components/V12CodeMarkdownTextSpec/Props.h>
#include <react/renderer/components/V12CodeMarkdownTextSpec/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {
extern const char V12CodeMarkdownTextRunComponentName[];

using V12CodeMarkdownTextRunShadowNode = ConcreteViewShadowNode<
    V12CodeMarkdownTextRunComponentName,
    V12CodeMarkdownTextRunProps,
    V12CodeMarkdownTextRunEventEmitter,
    V12CodeMarkdownTextRunState>;
}
