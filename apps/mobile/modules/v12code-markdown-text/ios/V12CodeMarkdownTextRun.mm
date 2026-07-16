#import "V12CodeMarkdownTextRun.h"
#import "V12CodeMarkdownText.h"
#import "V12CodeMarkdownTextRunComponentDescriptor.h"
#import <react/renderer/components/V12CodeMarkdownTextSpec/EventEmitters.h>
#import <react/renderer/components/V12CodeMarkdownTextSpec/Props.h>
#import <react/renderer/components/V12CodeMarkdownTextSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"
#import "Utils.h"

using namespace facebook::react;

@interface V12CodeMarkdownTextRun () <RCTV12CodeMarkdownTextRunViewProtocol>

@end

@implementation V12CodeMarkdownTextRun {
  NSString * _text;
  RCTBubblingEventBlock _onPress;
  RCTBubblingEventBlock _onLongPress;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<V12CodeMarkdownTextRunComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const V12CodeMarkdownTextRunProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<V12CodeMarkdownTextRunProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<V12CodeMarkdownTextRunProps const>(props);

  if (newViewProps.text != oldViewProps.text) {
    NSString *text = [NSString stringWithUTF8String:newViewProps.text.c_str()];
    _text = text;
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)onPress {
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const facebook::react::V12CodeMarkdownTextRunEventEmitter>(_eventEmitter)
    ->onPress(facebook::react::V12CodeMarkdownTextRunEventEmitter::OnPress{});
  }
}

- (void)onLongPress {
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const facebook::react::V12CodeMarkdownTextRunEventEmitter>(_eventEmitter)
    ->onLongPress(facebook::react::V12CodeMarkdownTextRunEventEmitter::OnLongPress{});
  }
}

+ (BOOL)shouldBeRecycled {
  return NO;
}

Class<RCTComponentViewProtocol> V12CodeMarkdownTextRunCls(void)
{
    return V12CodeMarkdownTextRun.class;
}

@end
