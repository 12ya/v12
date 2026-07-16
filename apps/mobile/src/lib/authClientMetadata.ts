import type { AuthClientPresentationMetadata } from "@v12code/contracts";
import { Platform } from "react-native";

export function authClientMetadata(): AuthClientPresentationMetadata {
  return {
    label: "V12Code Mobile",
    deviceType: "mobile",
    ...(Platform.OS === "ios" ? { os: "iOS" } : Platform.OS === "android" ? { os: "Android" } : {}),
  };
}
