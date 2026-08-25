import type { AppSettings } from "@zekraneh/domain";
import { useColorScheme } from "react-native";
import { useApp } from "@/providers/app-provider";

export interface AppColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly text: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly primaryStrong: string;
  readonly accent: string;
  readonly border: string;
  readonly danger: string;
  readonly success: string;
  readonly overlay: string;
}

export const LIGHT_COLORS: AppColors = {
  background: "#F7F2E8", surface: "#FFFCF7", surfaceMuted: "#EEE6D8", text: "#182F62",
  textMuted: "#66718A", primary: "#294A8A", primaryStrong: "#182F62", accent: "#D79614",
  border: "#DED3C2", danger: "#B33C4A", success: "#277255", overlay: "rgba(24, 47, 98, 0.08)",
};

export const DARK_COLORS: AppColors = {
  background: "#0F172A", surface: "#17213A", surfaceMuted: "#202D4B", text: "#F7F2E8",
  textMuted: "#B7BED0", primary: "#88A8E8", primaryStrong: "#294A8A", accent: "#F1B84B",
  border: "#33415F", danger: "#FF929C", success: "#79C6A6", overlay: "rgba(0, 0, 0, 0.22)",
};

export function resolveColorMode(theme: AppSettings["theme"], system: "light" | "dark" | "unspecified" | null | undefined): "light" | "dark" {
  return theme === "system" ? (system === "dark" ? "dark" : "light") : theme;
}

export function useAppTheme(): { colors: AppColors; mode: "light" | "dark" } {
  const system = useColorScheme();
  const { settings } = useApp();
  const mode = resolveColorMode(settings.theme, system);
  return { mode, colors: mode === "dark" ? DARK_COLORS : LIGHT_COLORS };
}
