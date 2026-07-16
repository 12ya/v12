import ExpoModulesCore

public final class V12CodeNativeControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V12CodeNativeControls")

    View(V12CodeHeaderButtonView.self) {
      Prop("label") { (view: V12CodeHeaderButtonView, label: String) in
        view.setLabel(label)
      }
      Prop("systemImage") { (view: V12CodeHeaderButtonView, systemImage: String) in
        view.setSystemImage(systemImage)
      }

      Events("onTriggered")
    }
  }
}
