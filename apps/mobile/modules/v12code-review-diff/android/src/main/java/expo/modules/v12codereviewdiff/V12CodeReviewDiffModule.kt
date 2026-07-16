package expo.modules.v12codereviewdiff

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12CodeReviewDiffModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12CodeReviewDiffSurface")

    View(V12CodeReviewDiffView::class) {
      Prop("tokensResetKey") { view: V12CodeReviewDiffView, tokensResetKey: String ->
        view.setTokensResetKey(tokensResetKey)
      }
      Prop("contentResetKey") { view: V12CodeReviewDiffView, contentResetKey: String ->
        view.setContentResetKey(contentResetKey)
      }
      Prop("collapsedFileIdsJson") { view: V12CodeReviewDiffView, collapsedFileIdsJson: String ->
        view.setCollapsedFileIdsJson(collapsedFileIdsJson)
      }
      Prop("viewedFileIdsJson") { view: V12CodeReviewDiffView, viewedFileIdsJson: String ->
        view.setViewedFileIdsJson(viewedFileIdsJson)
      }
      Prop("selectedRowIdsJson") { view: V12CodeReviewDiffView, selectedRowIdsJson: String ->
        view.setSelectedRowIdsJson(selectedRowIdsJson)
      }
      Prop("collapsedCommentIdsJson") { view: V12CodeReviewDiffView, collapsedCommentIdsJson: String ->
        view.setCollapsedCommentIdsJson(collapsedCommentIdsJson)
      }
      Prop("appearanceScheme") { view: V12CodeReviewDiffView, appearanceScheme: String ->
        view.setAppearanceScheme(appearanceScheme)
      }
      Prop("themeJson") { view: V12CodeReviewDiffView, themeJson: String ->
        view.setThemeJson(themeJson)
      }
      Prop("styleJson") { view: V12CodeReviewDiffView, styleJson: String ->
        view.setStyleJson(styleJson)
      }
      Prop("rowHeight") { view: V12CodeReviewDiffView, rowHeight: Double ->
        view.setRowHeight(rowHeight.toFloat())
      }
      Prop("contentWidth") { view: V12CodeReviewDiffView, contentWidth: Double ->
        view.setContentWidth(contentWidth.toFloat())
      }
      Prop("initialRowIndex") { view: V12CodeReviewDiffView, initialRowIndex: Double ->
        view.setInitialRowIndex(initialRowIndex)
      }

      Events(
        "onDebug",
        "onVisibleFileChange",
        "onToggleFile",
        "onToggleViewedFile",
        "onPressLine",
        "onToggleComment",
      )

      AsyncFunction("scrollToFile") { view: V12CodeReviewDiffView, fileId: String, animated: Boolean ->
        view.scrollToFile(fileId, animated)
      }
      AsyncFunction("scrollToTop") { view: V12CodeReviewDiffView, animated: Boolean ->
        view.scrollToTop(animated)
      }
      AsyncFunction("setRowsJson") { view: V12CodeReviewDiffView, rowsJson: String ->
        view.setRowsJson(rowsJson)
      }
      AsyncFunction("setTokensJson") { view: V12CodeReviewDiffView, tokensJson: String ->
        view.setTokensJson(tokensJson)
      }
      AsyncFunction("setTokensPatchJson") { view: V12CodeReviewDiffView, tokensPatchJson: String ->
        view.setTokensPatchJson(tokensPatchJson)
      }

      OnViewDestroys { view: V12CodeReviewDiffView ->
        view.cleanup()
      }
    }
  }
}
