import type { AppSettings } from "./types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  locale: "fa",
  theme: "system",
  hapticsEnabled: true,
  keepAwakeEnabled: true,
  showPersianTranslation: false,
};

export function normalizeAppSettings(stored: Readonly<Record<string, unknown>>): AppSettings {
  return {
    locale: stored.locale === "ar" ? "ar" : DEFAULT_APP_SETTINGS.locale,
    theme: stored.theme === "light" || stored.theme === "dark" || stored.theme === "system"
      ? stored.theme
      : DEFAULT_APP_SETTINGS.theme,
    hapticsEnabled: typeof stored.hapticsEnabled === "boolean"
      ? stored.hapticsEnabled
      : DEFAULT_APP_SETTINGS.hapticsEnabled,
    keepAwakeEnabled: typeof stored.keepAwakeEnabled === "boolean"
      ? stored.keepAwakeEnabled
      : DEFAULT_APP_SETTINGS.keepAwakeEnabled,
    showPersianTranslation: typeof stored.showPersianTranslation === "boolean"
      ? stored.showPersianTranslation
      : DEFAULT_APP_SETTINGS.showPersianTranslation,
  };
}
