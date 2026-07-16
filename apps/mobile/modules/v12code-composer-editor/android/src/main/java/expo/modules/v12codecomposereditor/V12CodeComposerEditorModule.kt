package expo.modules.v12codecomposereditor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12CodeComposerEditorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12CodeComposerEditor")

    View(V12CodeComposerEditorView::class) {
      Prop("controlledDocumentJson") { view: V12CodeComposerEditorView, documentJson: String ->
        view.setControlledDocumentJson(documentJson)
      }
      Prop("themeJson") { view: V12CodeComposerEditorView, themeJson: String ->
        view.setThemeJson(themeJson)
      }
      Prop("placeholder") { view: V12CodeComposerEditorView, placeholder: String ->
        view.setPlaceholder(placeholder)
      }
      Prop("fontFamily") { view: V12CodeComposerEditorView, fontFamily: String ->
        view.setFontFamily(fontFamily)
      }
      Prop("fontSize") { view: V12CodeComposerEditorView, fontSize: Double ->
        view.setFontSize(fontSize.toFloat())
      }
      Prop("lineHeight") { view: V12CodeComposerEditorView, lineHeight: Double ->
        view.setLineHeight(lineHeight.toFloat())
      }
      Prop("contentInsetVertical") { view: V12CodeComposerEditorView, contentInsetVertical: Double ->
        view.setContentInsetVertical(contentInsetVertical.toInt())
      }

      Prop("singleLineCentered") { view: V12CodeComposerEditorView, singleLineCentered: Boolean ->
        view.setSingleLineCentered(singleLineCentered)
      }
      Prop("editable") { view: V12CodeComposerEditorView, editable: Boolean ->
        view.setEditable(editable)
      }
      Prop("scrollEnabled") { view: V12CodeComposerEditorView, scrollEnabled: Boolean ->
        view.setScrollEnabled(scrollEnabled)
      }
      Prop("autoFocus") { view: V12CodeComposerEditorView, autoFocus: Boolean ->
        view.setAutoFocus(autoFocus)
      }
      Prop("autoCorrect") { view: V12CodeComposerEditorView, autoCorrect: Boolean ->
        view.setAutoCorrect(autoCorrect)
      }
      Prop("spellCheck") { view: V12CodeComposerEditorView, spellCheck: Boolean ->
        view.setSpellCheck(spellCheck)
      }

      Events(
        "onComposerChange",
        "onComposerSelectionChange",
        "onComposerFocus",
        "onComposerBlur",
        "onComposerPasteImages",
        "onComposerContentSizeChange",
      )

      AsyncFunction("focus") { view: V12CodeComposerEditorView ->
        view.focusEditor()
      }
      AsyncFunction("blur") { view: V12CodeComposerEditorView ->
        view.blurEditor()
      }
      AsyncFunction("setSelection") { view: V12CodeComposerEditorView, start: Int, end: Int ->
        view.setSelection(start, end)
      }
    }
  }
}
