#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "Utils.h"

@interface V12MarkdownTextManager : RCTViewManager
@end

@implementation V12MarkdownTextManager

RCT_EXPORT_MODULE(V12MarkdownText)

- (UIView *)view
{
  return [[UIView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(color, NSString, UIView)
{
}

@end

@interface V12MarkdownTextRunManager : RCTViewManager
@end

@implementation V12MarkdownTextRunManager

RCT_EXPORT_MODULE(V12MarkdownTextRun)

- (UIView *)view
{
  return nil;
}

@end
