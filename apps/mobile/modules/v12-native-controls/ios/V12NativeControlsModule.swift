import ExpoModulesCore

public final class V12NativeControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V12NativeControls")

    View(V12HeaderButtonView.self) {
      Prop("label") { (view: V12HeaderButtonView, label: String) in
        view.setLabel(label)
      }
      Prop("systemImage") { (view: V12HeaderButtonView, systemImage: String) in
        view.setSystemImage(systemImage)
      }

      Events("onTriggered")
    }
  }
}
