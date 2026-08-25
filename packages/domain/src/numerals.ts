const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Latin and Arabic-Indic digits while leaving the rest of the value intact. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9\u0660-\u0669]/g, (digit) => {
    const index = digit >= "0" && digit <= "9" ? digit.charCodeAt(0) - 48 : digit.charCodeAt(0) - 0x0660;
    return PERSIAN_DIGITS[index] ?? digit;
  });
}
