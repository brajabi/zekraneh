export interface PersianDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface PersianCalendarDay extends PersianDateParts {
  readonly gregorianDate: Date;
  /** Saturday is 0 and Friday is 6. */
  readonly weekDay: number;
}

const persianFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function persianDateParts(value: Date | string): PersianDateParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = persianFormatter.formatToParts(date);
  const numberPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const result = { year: numberPart("year"), month: numberPart("month"), day: numberPart("day") };
  if (!result.year || !result.month || !result.day) throw new Error("تاریخ شمسی قابل محاسبه نیست");
  return result;
}

export function persianDateKey(value: Date | string): string {
  const { year, month, day } = persianDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftPersianMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = year * 12 + month - 1 + delta;
  return { year: Math.floor(zeroBased / 12), month: ((zeroBased % 12) + 12) % 12 + 1 };
}

export function buildPersianMonth(year: number, month: number): readonly PersianCalendarDay[] {
  const days: PersianCalendarDay[] = [];
  const cursor = new Date(year + 621, 0, 1, 12, 0, 0, 0);
  for (let index = 0; index < 460; index += 1) {
    const parts = persianDateParts(cursor);
    if (parts.year === year && parts.month === month) {
      days.push({ ...parts, gregorianDate: new Date(cursor), weekDay: (cursor.getDay() + 1) % 7 });
    } else if (days.length > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (days.length === 0) throw new Error(`ماه شمسی پیدا نشد: ${year}/${month}`);
  return days;
}
