#import "V12MarkdownTextRun.h"
#import "V12MarkdownText.h"
#import "V12MarkdownTextRunComponentDescriptor.h"
#import <react/renderer/components/V12MarkdownTextSpec/EventEmitters.h>
#import <react/renderer/components/V12MarkdownTextSpec/Props.h>
#import <react/renderer/components/V12MarkdownTextSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"
#import "Utils.h"

using namespace facebook::react;

@interface V12MarkdownTextRun () <RCTV12MarkdownTextRunViewProtocol>

@end

@implementation V12MarkdownTextRun {
  NSString * _text;
  RCTBubblingEventBlock _onPress;
  RCTBubblingEventBlock _onLongPress;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<V12MarkdownTextRunComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const V12MarkdownTextRunProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<V12MarkdownTextRunProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<V12MarkdownTextRunProps const>(props);

  if (newViewProps.text != oldViewProps.text) {
    NSString *text = [NSString stringWithUTF8String:newViewProps.text.c_str()];
    _text = text;
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)onPress {
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const facebook::react::V12MarkdownTextRunEventEmitter>(_eventEmitter)
    ->onPress(facebook::react::V12MarkdownTextRunEventEmitter::OnPress{});
  }
}

- (void)onLongPress {
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const facebook::react::V12MarkdownTextRunEventEmitter>(_eventEmitter)
    ->onLongPress(facebook::react::V12MarkdownTextRunEventEmitter::OnLongPress{});
  }
}

+ (BOOL)shouldBeRecycled {
  return NO;
}

Class<RCTComponentViewProtocol> V12MarkdownTextRunCls(void)
{
    return V12MarkdownTextRun.class;
}

@end
