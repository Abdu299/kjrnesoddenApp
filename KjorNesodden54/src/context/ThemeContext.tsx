import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";

import {
  appColors,
  isThemePreference,
  resolveColorScheme,
  type AppColorScheme,
  type AppThemeColors,
  type ThemePreference,
} from "../constants/app-theme";

export const THEME_STORAGE_KEY = "kjornesodden-theme-preference";

type ThemeContextValue = {
  preference: ThemePreference;
  colorScheme: AppColorScheme;
  colors: AppThemeColors;
  ready: boolean;
  saveError: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const changedByUser = useRef(false);
  const mounted = useRef(true);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const writeVersion = useRef(0);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (active && !changedByUser.current && isThemePreference(saved)) {
          setPreferenceState(saved);
        }
      })
      .catch((error: unknown) => {
        console.warn("Could not load appearance preference:", error);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    const version = ++writeVersion.current;
    changedByUser.current = true;
    setPreferenceState(next);
    setSaveError(false);
    // Serialize rapid changes so the last selection is also the one saved.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(THEME_STORAGE_KEY, next))
      .catch((error: unknown) => {
        console.warn("Could not save appearance preference:", error);
        if (mounted.current && version === writeVersion.current) setSaveError(true);
      });
  }, []);

  const colorScheme = resolveColorScheme(preference, systemScheme);
  const colors = appColors[colorScheme];

  useLayoutEffect(() => {
    // Native alerts, keyboards and pickers should match the selected theme.
    // React Native Web has no setColorScheme implementation.
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(preference === "system" ? "auto" : preference);
    }
  }, [preference]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch((error: unknown) => {
      console.warn("Could not update system background:", error);
    });
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.style.colorScheme = colorScheme;
      document.documentElement.style.backgroundColor = colors.background;
    }
  }, [colors.background, colorScheme]);

  const value = useMemo(
    () => ({ preference, colorScheme, colors, ready, saveError, setPreference }),
    [preference, colorScheme, colors, ready, saveError, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useAppTheme must be used inside ThemeProvider");
  return theme;
}

export function useThemedStyles<T>(factory: (colors: AppThemeColors) => T) {
  const theme = useAppTheme();
  const styles = useMemo(() => factory(theme.colors), [factory, theme.colors]);
  return { ...theme, styles };
}
