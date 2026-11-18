export type ThemePreference = "system" | "light" | "dark";
export type AppColorScheme = "light" | "dark";

const lightColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F7FA",
  inputBackground: "#FFFFFF",
  text: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#647084",
  placeholder: "#647084",
  border: "#DCE3EB",
  inputBorder: "#7F8FA3",
  divider: "#E7ECF2",
  primary: "#146CC0",
  primaryFill: "#146CC0",
  primarySoft: "#EAF4FF",
  primaryBorder: "#B6D6F5",
  onPrimary: "#FFFFFF",
  danger: "#B42330",
  dangerFill: "#BD2935",
  dangerSoft: "#FFF0F1",
  dangerBorder: "#EFBAC0",
  success: "#217348",
  successSoft: "#EAF7EF",
  disabled: "#758195",
  backdrop: "rgba(0, 0, 0, 0.46)",
  shadow: "#000000",
  chipBackground: "#F0EEE8",
  chipText: "#17213B",
  chipSelectedBackground: "#17213B",
  chipSelectedText: "#FFFFFF",
  imageBackground: "#F4F6F8",
};

export type AppThemeColors = typeof lightColors;

const darkColors: AppThemeColors = {
  background: "#101620",
  surface: "#192330",
  surfaceMuted: "#222F40",
  inputBackground: "#121B28",
  text: "#F2F5FA",
  textSecondary: "#C2CDDD",
  textMuted: "#A5B2C5",
  placeholder: "#9AA9BD",
  border: "#3B4B61",
  inputBorder: "#6B7F9A",
  divider: "#324055",
  primary: "#8BC5FF",
  primaryFill: "#1767B8",
  primarySoft: "#1C3550",
  primaryBorder: "#4F7BA5",
  onPrimary: "#FFFFFF",
  danger: "#FFACB2",
  dangerFill: "#AA2637",
  dangerSoft: "#3D2531",
  dangerBorder: "#9A5667",
  success: "#8CDEAE",
  successSoft: "#193B30",
  disabled: "#56667E",
  backdrop: "rgba(0, 0, 0, 0.72)",
  shadow: "#000000",
  chipBackground: "#29384B",
  chipText: "#D7E6FA",
  chipSelectedBackground: "#B7D9FF",
  chipSelectedText: "#10243C",
  // Keep restaurant logos readable without changing their original artwork.
  imageBackground: "#EAF0F6",
};

export const appColors = { light: lightColors, dark: darkColors };

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined
): AppColorScheme {
  return preference === "system"
    ? systemScheme === "dark" ? "dark" : "light"
    : preference;
}
