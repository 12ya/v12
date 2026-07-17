import ExpoModulesCore

public class V12CodeTerminalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V12CodeTerminalSurface")

    // Bumped when native hardware-keyboard handling changes; surfaced in the JS debug
    // logs so a stale native binary is distinguishable from a broken key pipeline.
    Constants([
      "hardwareKeyRevision": 3,
    ])

    View(V12CodeTerminalView.self) {
      Prop("terminalKey") { (view: V12CodeTerminalView, terminalKey: String) in
        view.terminalKey = terminalKey
      }

      Prop("initialBuffer") { (view: V12CodeTerminalView, initialBuffer: String) in
        view.initialBuffer = initialBuffer
      }

      Prop("fontSize") { (view: V12CodeTerminalView, fontSize: Double) in
        view.fontSize = CGFloat(fontSize)
      }

      Prop("focusRequest") { (view: V12CodeTerminalView, focusRequest: Double) in
        view.focusRequest = focusRequest
      }

      Prop("autoFocus") { (view: V12CodeTerminalView, autoFocus: Bool) in
        view.autoFocus = autoFocus
      }

      Prop("appearanceScheme") { (view: V12CodeTerminalView, appearanceScheme: String) in
        view.appearanceScheme = appearanceScheme
      }

      Prop("themeConfig") { (view: V12CodeTerminalView, themeConfig: String) in
        view.themeConfig = themeConfig
      }

      Prop("backgroundColor") { (view: V12CodeTerminalView, backgroundColor: String) in
        view.backgroundColorHex = backgroundColor
      }

      Prop("foregroundColor") { (view: V12CodeTerminalView, foregroundColor: String) in
        view.foregroundColorHex = foregroundColor
      }

      Prop("mutedForegroundColor") { (view: V12CodeTerminalView, mutedForegroundColor: String) in
        view.mutedForegroundColorHex = mutedForegroundColor
      }

      Events("onInput", "onResize")
    }
  }
}
