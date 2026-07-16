import ExpoModulesCore

public class V12CodeComposerEditorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V12CodeComposerEditor")

    View(V12CodeComposerEditorView.self) {
      Prop("controlledDocumentJson") { (view: V12CodeComposerEditorView, documentJson: String) in
        view.setControlledDocumentJson(documentJson)
      }
      Prop("themeJson") { (view: V12CodeComposerEditorView, themeJson: String) in
        view.setThemeJson(themeJson)
      }
      Prop("placeholder") { (view: V12CodeComposerEditorView, placeholder: String) in
        view.setPlaceholder(placeholder)
      }
      Prop("fontFamily") { (view: V12CodeComposerEditorView, fontFamily: String) in
        view.setFontFamily(fontFamily)
      }
      Prop("fontSize") { (view: V12CodeComposerEditorView, fontSize: Double) in
        view.setFontSize(CGFloat(fontSize))
      }
      Prop("lineHeight") { (view: V12CodeComposerEditorView, lineHeight: Double) in
        view.setLineHeight(CGFloat(lineHeight))
      }
      Prop("contentInsetVertical") { (view: V12CodeComposerEditorView, contentInsetVertical: Double) in
        view.setContentInsetVertical(CGFloat(contentInsetVertical))
      }
      Prop("editable") { (view: V12CodeComposerEditorView, editable: Bool) in
        view.setEditable(editable)
      }
      Prop("scrollEnabled") { (view: V12CodeComposerEditorView, scrollEnabled: Bool) in
        view.setScrollEnabled(scrollEnabled)
      }
      Prop("autoFocus") { (view: V12CodeComposerEditorView, autoFocus: Bool) in
        view.setAutoFocus(autoFocus)
      }
      Prop("autoCorrect") { (view: V12CodeComposerEditorView, autoCorrect: Bool) in
        view.setAutoCorrect(autoCorrect)
      }
      Prop("spellCheck") { (view: V12CodeComposerEditorView, spellCheck: Bool) in
        view.setSpellCheck(spellCheck)
      }

      Events(
        "onComposerChange",
        "onComposerSelectionChange",
        "onComposerFocus",
        "onComposerBlur",
        "onComposerSubmit",
        "onComposerPasteImages",
        "onComposerContentSizeChange"
      )

      AsyncFunction("focus") { (view: V12CodeComposerEditorView) in
        view.focusEditor()
      }
      AsyncFunction("blur") { (view: V12CodeComposerEditorView) in
        view.blurEditor()
      }
      AsyncFunction("setSelection") { (view: V12CodeComposerEditorView, start: Int, end: Int) in
        view.setSelection(start: start, end: end)
      }
    }
  }
}
