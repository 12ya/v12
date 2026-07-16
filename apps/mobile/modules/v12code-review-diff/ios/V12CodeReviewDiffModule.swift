import ExpoModulesCore

public class V12CodeReviewDiffModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V12CodeReviewDiffSurface")

    View(V12CodeReviewDiffView.self) {
      Prop("tokensResetKey") { (view: V12CodeReviewDiffView, tokensResetKey: String) in
        view.setTokensResetKey(tokensResetKey)
      }

      Prop("contentResetKey") { (view: V12CodeReviewDiffView, contentResetKey: String) in
        view.setContentResetKey(contentResetKey)
      }

      Prop("collapsedFileIdsJson") { (view: V12CodeReviewDiffView, collapsedFileIdsJson: String) in
        view.setCollapsedFileIdsJson(collapsedFileIdsJson)
      }

      Prop("viewedFileIdsJson") { (view: V12CodeReviewDiffView, viewedFileIdsJson: String) in
        view.setViewedFileIdsJson(viewedFileIdsJson)
      }

      Prop("selectedRowIdsJson") { (view: V12CodeReviewDiffView, selectedRowIdsJson: String) in
        view.setSelectedRowIdsJson(selectedRowIdsJson)
      }

      Prop("collapsedCommentIdsJson") { (view: V12CodeReviewDiffView, collapsedCommentIdsJson: String) in
        view.setCollapsedCommentIdsJson(collapsedCommentIdsJson)
      }

      Prop("appearanceScheme") { (view: V12CodeReviewDiffView, appearanceScheme: String) in
        view.setAppearanceScheme(appearanceScheme)
      }

      Prop("themeJson") { (view: V12CodeReviewDiffView, themeJson: String) in
        view.setThemeJson(themeJson)
      }

      Prop("styleJson") { (view: V12CodeReviewDiffView, styleJson: String) in
        view.setStyleJson(styleJson)
      }

      Prop("rowHeight") { (view: V12CodeReviewDiffView, rowHeight: Double) in
        view.setRowHeight(CGFloat(rowHeight))
      }

      Prop("contentWidth") { (view: V12CodeReviewDiffView, contentWidth: Double) in
        view.setContentWidth(CGFloat(contentWidth))
      }

      Prop("initialRowIndex") { (view: V12CodeReviewDiffView, initialRowIndex: Double) in
        view.setInitialRowIndex(initialRowIndex)
      }

      Prop("refreshing") { (view: V12CodeReviewDiffView, refreshing: Bool) in
        view.setRefreshing(refreshing)
      }

      Events(
        "onDebug",
        "onVisibleFileChange",
        "onToggleFile",
        "onToggleViewedFile",
        "onPressLine",
        "onToggleComment",
        "onPullToRefresh"
      )

      AsyncFunction("scrollToFile") { (view: V12CodeReviewDiffView, fileId: String, animated: Bool) in
        view.scrollToFile(fileId, animated: animated)
      }

      AsyncFunction("scrollToTop") { (view: V12CodeReviewDiffView, animated: Bool) in
        view.scrollToTop(animated: animated)
      }

      // Large, frequently changing JSON values cannot be regular Fabric props. Expo's
      // prop adapter compares strings on the main thread before invoking a setter, which
      // makes a syntax-token patch capable of blocking a frame by itself.
      AsyncFunction("setRowsJson") { (view: V12CodeReviewDiffView, rowsJson: String) in
        view.setRowsJson(rowsJson)
      }

      AsyncFunction("setTokensJson") { (view: V12CodeReviewDiffView, tokensJson: String) in
        view.setTokensJson(tokensJson)
      }

      AsyncFunction("setTokensPatchJson") { (view: V12CodeReviewDiffView, tokensPatchJson: String) in
        view.setTokensPatchJson(tokensPatchJson)
      }
    }
  }
}
