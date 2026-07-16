package expo.modules.v12nativecontrols

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12NativeControlsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12NativeControls")

    View(V12HeaderButtonView::class) {
      Prop("label") { view: V12HeaderButtonView, label: String ->
        view.setLabel(label)
      }
      Prop("systemImage") { view: V12HeaderButtonView, systemImage: String ->
        view.setSystemImage(systemImage)
      }

      Events("onTriggered")
    }
  }
}
