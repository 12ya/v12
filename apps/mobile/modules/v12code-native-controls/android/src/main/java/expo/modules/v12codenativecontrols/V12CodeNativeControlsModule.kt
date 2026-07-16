package expo.modules.v12codenativecontrols

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12CodeNativeControlsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12CodeNativeControls")

    View(V12CodeHeaderButtonView::class) {
      Prop("label") { view: V12CodeHeaderButtonView, label: String ->
        view.setLabel(label)
      }
      Prop("systemImage") { view: V12CodeHeaderButtonView, systemImage: String ->
        view.setSystemImage(systemImage)
      }

      Events("onTriggered")
    }
  }
}
