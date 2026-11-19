import * as Application from "expo-application";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { validAppVersion, type AppPlatform } from "./appUpdatePolicy";

export function getInstalledRelease(): { platform: AppPlatform; version: string } | null {
  // Expo Go has its own version; an OTA manifest can also differ from the installed binary.
  if (__DEV__ || Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Platform.OS !== "ios" && Platform.OS !== "android") || !validAppVersion(Application.nativeApplicationVersion)) return null;
  return { platform: Platform.OS, version: Application.nativeApplicationVersion };
}
