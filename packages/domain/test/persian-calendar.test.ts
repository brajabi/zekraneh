import { describe, expect, test } from "bun:test";
import { buildPersianMonth, persianDateKey, persianDateParts, shiftPersianMonth } from "../src/persian-calendar";

describe("تقویم شمسی", () => {
  test("نوروز ۱۴۰۵ را درست تبدیل می‌کند", () => {
    const date = new Date(2026, 2, 21, 12);
    expect(persianDateParts(date)).toEqual({ year: 1405, month: 1, day: 1 });
    expect(persianDateKey(date)).toBe("1405-01-01");
  });

  test("ماه‌های شمسی را در مرز سال جابه‌جا می‌کند", () => {
    expect(shiftPersianMonth(1405, 12, 1)).toEqual({ year: 1406, month: 1 });
    expect(shiftPersianMonth(1405, 1, -1)).toEqual({ year: 1404, month: 12 });
  });

  test("ماه کامل با جایگاه شنبه‌محور می‌سازد", () => {
    const days = buildPersianMonth(1405, 1);
    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({ year: 1405, month: 1, day: 1, weekDay: 0 });
  });
});
