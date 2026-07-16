#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "Utils.h"

@interface V12CodeMarkdownTextManager : RCTViewManager
@end

@implementation V12CodeMarkdownTextManager

RCT_EXPORT_MODULE(V12CodeMarkdownText)

- (UIView *)view
{
  return [[UIView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(color, NSString, UIView)
{
}

@end

@interface V12CodeMarkdownTextRunManager : RCTViewManager
@end

@implementation V12CodeMarkdownTextRunManager

RCT_EXPORT_MODULE(V12CodeMarkdownTextRun)

- (UIView *)view
{
  return nil;
}

@end
