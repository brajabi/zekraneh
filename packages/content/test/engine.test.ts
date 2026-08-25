import { describe, expect, test } from "bun:test";
import {
  PrayerEngineError,
  advanceSession,
  createSession,
  decrementCounter,
  incrementCounter,
  incrementCounterAndAdvance,
  moveSessionStep,
  resetCounter,
  resolveAndAdvance,
  resolveCurrentStep,
  sessionProgress,
  stepsForMode,
  type PrayerSession,
} from "@zekraneh/domain";
import { nightPrayer } from "../src";

function atCounter(stepId: string): PrayerSession {
  return { ...createSession(nightPrayer, "witr-only", "session-1", "2026-01-01T00:00:00.000Z"), currentStepId: stepId };
}

describe("موتور اجرای نماز", () => {
  test("پیش از حل گام عبور نمی‌کند", () => {
    const session = createSession(nightPrayer, "witr-only");
    expect(() => advanceSession(nightPrayer, session)).toThrow(PrayerEngineError);
  });

  test("شمارنده سقف target دارد و پیش از target کامل نمی‌شود", () => {
    let session = atCounter("witr-ikhlas-3");
    session = incrementCounter(nightPrayer, session);
    expect(() => resolveCurrentStep(nightPrayer, session, "completed")).toThrow("شمارنده هنوز");
    for (let index = 0; index < 5; index += 1) session = incrementCounter(nightPrayer, session);
    expect(session.stepStates["witr-ikhlas-3"]?.count).toBe(3);
    expect(resolveCurrentStep(nightPrayer, session, "completed").stepStates["witr-ikhlas-3"]?.resolution).toBe("completed");
  });

  test("کم‌کردن زیر صفر نمی‌رود و reset صفر می‌کند", () => {
    let session = atCounter("witr-istighfar-70");
    session = decrementCounter(nightPrayer, session);
    expect(session.stepStates["witr-istighfar-70"]?.count).toBe(0);
    session = incrementCounter(nightPrayer, session);
    session = resetCounter(nightPrayer, session);
    expect(session.stepStates["witr-istighfar-70"]?.count).toBe(0);
  });

  test("مستحب رد می‌شود اما عمل اصلی نه", () => {
    expect(resolveCurrentStep(nightPrayer, atCounter("witr-afw-300"), "skipped").stepStates["witr-afw-300"]?.resolution).toBe("skipped");
    const core = createSession(nightPrayer, "witr-only");
    expect(() => resolveCurrentStep(nightPrayer, core, "skipped")).toThrow("گام اصلی");
  });

  test("پیشرفت گام انجام‌شده و ردشده را حساب می‌کند", () => {
    let session = createSession(nightPrayer, "witr-only");
    session = resolveCurrentStep(nightPrayer, session, "completed");
    session = advanceSession(nightPrayer, session)!;
    session = resolveCurrentStep(nightPrayer, session, "completed");
    session = advanceSession(nightPrayer, session)!;
    session = resolveCurrentStep(nightPrayer, session, "skipped");
    const progress = sessionProgress(nightPrayer, session);
    expect(progress.solved).toBe(3);
    expect(progress.total).toBe(stepsForMode(nightPrayer, "witr-only").length);
  });

  test("تکمیل و ردکردن در همان transition به گام بعد می‌روند", () => {
    const first = createSession(nightPrayer, "witr-only");
    const completed = resolveAndAdvance(nightPrayer, first, "completed");
    expect(completed?.currentStepId).not.toBe(first.currentStepId);

    const optional = atCounter("witr-afw-300");
    const skipped = resolveAndAdvance(nightPrayer, optional, "skipped");
    expect(skipped?.currentStepId).not.toBe(optional.currentStepId);
    expect(skipped?.stepStates[optional.currentStepId]?.resolution).toBe("skipped");
  });

  test("ضربهٔ رسیدن به هدف شمارنده را حل و گام بعد را باز می‌کند", () => {
    let session: PrayerSession | null = atCounter("witr-ikhlas-3");
    session = incrementCounterAndAdvance(nightPrayer, session)!;
    session = incrementCounterAndAdvance(nightPrayer, session)!;
    expect(session.currentStepId).toBe("witr-ikhlas-3");
    session = incrementCounterAndAdvance(nightPrayer, session)!;
    expect(session.currentStepId).not.toBe("witr-ikhlas-3");
    expect(session.stepStates["witr-ikhlas-3"]?.resolution).toBe("completed");
  });

  test("حل آخرین گام جلسه را پایان می‌دهد", () => {
    const steps = stepsForMode(nightPrayer, "witr-only");
    const last = steps.at(-1)!;
    const session = { ...createSession(nightPrayer, "witr-only"), currentStepId: last.id };
    expect(resolveAndAdvance(nightPrayer, session, "completed")).toBeNull();
  });

  test("رفتن به بعد ذکر حل‌نشده را رد می‌کند و برگشت شمارش را نگه می‌دارد", () => {
    let session = atCounter("witr-istighfar-70");
    session = incrementCounter(nightPrayer, session);
    const next = moveSessionStep(nightPrayer, session, "next")!;
    expect(next.currentStepId).toBe("witr-believers-40");
    expect(next.stepStates["witr-istighfar-70"]?.resolution).toBe("skipped");
    const previous = moveSessionStep(nightPrayer, next, "previous")!;
    expect(previous.currentStepId).toBe("witr-istighfar-70");
    expect(previous.stepStates["witr-istighfar-70"]?.count).toBe(1);
  });
});
