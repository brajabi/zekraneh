import { describe, expect, test } from "bun:test";
import { toPersianDigits } from "../src/numerals";

describe("نمایش ارقام فارسی", () => {
  test("همهٔ ارقام لاتین را تبدیل می‌کند", () => {
    expect(toPersianDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
  });

  test("ارقام عربی و رشته‌های ترکیبی را بدون تغییر متن تبدیل می‌کند", () => {
    expect(toPersianDigits("گام 12 از ٣٤ — v5")).toBe("گام ۱۲ از ۳۴ — v۵");
  });

  test("عدد را نیز می‌پذیرد", () => {
    expect(toPersianDigits(407)).toBe("۴۰۷");
  });
});
