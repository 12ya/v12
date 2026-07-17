package expo.modules.v12codenativecontrols

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12CodeNativeControlsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12CodeNativeControls")

    Function("getShowcasePairingUrl") {
      appContext.currentActivity?.intent?.getStringExtra("showcasePairingUrl")
    }

    Function("getShowcaseScene") {
      val storedScene = appContext.reactContext
        ?.filesDir
        ?.resolve("v12code-showcase-scene")
        ?.takeIf { it.isFile }
        ?.readText()
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
      storedScene ?: appContext.currentActivity?.intent?.getStringExtra("showcaseScene")
    }

    Function("prepareShowcaseCapture") {
      // Android app data is cleared by the host runner before launch.
    }

    Function("markShowcaseReady") { scene: String ->
      appContext.reactContext
        ?.filesDir
        ?.resolve("v12code-showcase-ready")
        ?.writeText(scene)
    }

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
