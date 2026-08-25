import { describe, expect, test } from "bun:test";
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from "../src/settings";

describe("تنظیمات برنامه", () => {
  test("تنظیمات قدیمی ترجمه را خاموش در نظر می‌گیرد", () => {
    expect(normalizeAppSettings({
      locale: "ar",
      theme: "dark",
      hapticsEnabled: false,
      keepAwakeEnabled: false,
    })).toEqual({
      locale: "ar",
      theme: "dark",
      hapticsEnabled: false,
      keepAwakeEnabled: false,
      showPersianTranslation: false,
    });
    expect(DEFAULT_APP_SETTINGS.showPersianTranslation).toBeFalse();
  });

  test("مقدار فعال ترجمه را پس از خواندن نگه می‌دارد", () => {
    expect(normalizeAppSettings({ showPersianTranslation: true }).showPersianTranslation).toBeTrue();
  });
});
