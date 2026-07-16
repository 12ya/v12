package expo.modules.v12codeterminal

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class V12CodeTerminalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V12CodeTerminalSurface")

    // Bumped when native hardware-keyboard handling changes; surfaced in the JS debug
    // logs so a stale native binary is distinguishable from a broken key pipeline.
    Constants(
      "hardwareKeyRevision" to 2,
    )

    View(V12CodeTerminalView::class) {
      Prop("terminalKey") { view: V12CodeTerminalView, terminalKey: String ->
        view.terminalKey = terminalKey
      }

      Prop("initialBuffer") { view: V12CodeTerminalView, initialBuffer: String ->
        view.initialBuffer = initialBuffer
      }

      Prop("fontSize") { view: V12CodeTerminalView, fontSize: Double ->
        view.fontSize = fontSize.toFloat()
      }

      Prop("focusRequest") { view: V12CodeTerminalView, focusRequest: Double ->
        view.focusRequest = focusRequest
      }

      Prop("appearanceScheme") { view: V12CodeTerminalView, appearanceScheme: String ->
        view.appearanceScheme = appearanceScheme
      }

      Prop("themeConfig") { view: V12CodeTerminalView, themeConfig: String ->
        view.themeConfig = themeConfig
      }

      Prop("backgroundColor") { view: V12CodeTerminalView, backgroundColor: String ->
        view.backgroundColorHex = backgroundColor
      }

      Prop("foregroundColor") { view: V12CodeTerminalView, foregroundColor: String ->
        view.foregroundColorHex = foregroundColor
      }

      Prop("mutedForegroundColor") { view: V12CodeTerminalView, mutedForegroundColor: String ->
        view.mutedForegroundColorHex = mutedForegroundColor
      }

      Events("onInput", "onResize")

      OnViewDestroys { view: V12CodeTerminalView ->
        view.cleanup()
      }
    }
  }
}
