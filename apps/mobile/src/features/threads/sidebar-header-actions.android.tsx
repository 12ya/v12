import { View } from "react-native";

import { V12CodeHeaderButton } from "../../native/V12CodeHeaderButton.android";
import type { SidebarHeaderActionsProps } from "./sidebar-header-actions";

export function SidebarHeaderActions(props: SidebarHeaderActionsProps) {
  return (
    <View className="h-11 flex-row gap-1">
      <V12CodeHeaderButton
        accessibilityLabel="Open settings"
        icon="gearshape"
        onPress={props.onOpenSettings}
      />
    </View>
  );
}
