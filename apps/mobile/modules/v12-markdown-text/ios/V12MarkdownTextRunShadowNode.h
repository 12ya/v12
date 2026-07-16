#pragma once

#include <react/renderer/components/V12MarkdownTextSpec/EventEmitters.h>
#include <react/renderer/components/V12MarkdownTextSpec/Props.h>
#include <react/renderer/components/V12MarkdownTextSpec/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {
extern const char V12MarkdownTextRunComponentName[];

using V12MarkdownTextRunShadowNode = ConcreteViewShadowNode<
    V12MarkdownTextRunComponentName,
    V12MarkdownTextRunProps,
    V12MarkdownTextRunEventEmitter,
    V12MarkdownTextRunState>;
}
