import type {
  PrayerDefinition,
  PrayerSession,
  PrayerStep,
  SessionStepState,
} from "./types";

export class PrayerEngineError extends Error {}

function createSessionId(): string {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function stepsForMode(prayer: PrayerDefinition, modeId: string): readonly PrayerStep[] {
  const mode = prayer.modes.find((candidate) => candidate.id === modeId);
  if (!mode) throw new PrayerEngineError(`حالت اجرا پیدا نشد: ${modeId}`);
  const stages = new Map(prayer.stages.map((stage) => [stage.id, stage]));
  return mode.stageIds.flatMap((stageId) => {
    const stage = stages.get(stageId);
    if (!stage) throw new PrayerEngineError(`بخش پیدا نشد: ${stageId}`);
    return stage.steps;
  });
}

export function createSession(
  prayer: PrayerDefinition,
  modeId: string,
  id: string = createSessionId(),
  now: string = new Date().toISOString(),
): PrayerSession {
  const steps = stepsForMode(prayer, modeId);
  const first = steps[0];
  if (!first) throw new PrayerEngineError("این حالت هیچ گامی ندارد");
  return {
    id,
    prayerId: prayer.id,
    prayerVersion: prayer.version,
    contentVersion: prayer.contentVersion,
    modeId,
    currentStepId: first.id,
    startedAt: now,
    updatedAt: now,
    stepStates: {},
  };
}

function currentStep(prayer: PrayerDefinition, session: PrayerSession): PrayerStep {
  const step = stepsForMode(prayer, session.modeId).find((candidate) => candidate.id === session.currentStepId);
  if (!step) throw new PrayerEngineError("گام جاری در نسخه فعلی محتوا پیدا نشد");
  return step;
}

function updateState(
  session: PrayerSession,
  step: PrayerStep,
  patch: Partial<SessionStepState>,
  now: string,
): PrayerSession {
  const previous = session.stepStates[step.id];
  return {
    ...session,
    updatedAt: now,
    stepStates: {
      ...session.stepStates,
      [step.id]: {
        stepId: step.id,
        count: previous?.count ?? 0,
        resolution: previous?.resolution ?? null,
        updatedAt: now,
        ...patch,
      },
    },
  };
}

export function incrementCounter(prayer: PrayerDefinition, session: PrayerSession, now = new Date().toISOString()): PrayerSession {
  const step = currentStep(prayer, session);
  if (step.kind !== "counter") throw new PrayerEngineError("گام جاری شمارنده نیست");
  const count = Math.min((session.stepStates[step.id]?.count ?? 0) + 1, step.target);
  return updateState(session, step, { count }, now);
}

export function decrementCounter(prayer: PrayerDefinition, session: PrayerSession, now = new Date().toISOString()): PrayerSession {
  const step = currentStep(prayer, session);
  if (step.kind !== "counter") throw new PrayerEngineError("گام جاری شمارنده نیست");
  const count = Math.max((session.stepStates[step.id]?.count ?? 0) - 1, 0);
  return updateState(session, step, { count, resolution: null }, now);
}

export function resetCounter(prayer: PrayerDefinition, session: PrayerSession, now = new Date().toISOString()): PrayerSession {
  const step = currentStep(prayer, session);
  if (step.kind !== "counter") throw new PrayerEngineError("گام جاری شمارنده نیست");
  return updateState(session, step, { count: 0, resolution: null }, now);
}

export function resolveCurrentStep(
  prayer: PrayerDefinition,
  session: PrayerSession,
  resolution: "completed" | "skipped",
  now = new Date().toISOString(),
): PrayerSession {
  const step = currentStep(prayer, session);
  if (resolution === "skipped" && !step.optional) throw new PrayerEngineError("گام اصلی قابل ردکردن نیست");
  if (resolution === "completed" && step.kind === "counter" && (session.stepStates[step.id]?.count ?? 0) < step.target) {
    throw new PrayerEngineError("شمارنده هنوز به هدف نرسیده است");
  }
  return updateState(session, step, { resolution }, now);
}

export function advanceSession(prayer: PrayerDefinition, session: PrayerSession, now = new Date().toISOString()): PrayerSession | null {
  const steps = stepsForMode(prayer, session.modeId);
  const index = steps.findIndex((step) => step.id === session.currentStepId);
  if (index < 0) throw new PrayerEngineError("گام جاری پیدا نشد");
  if (!session.stepStates[session.currentStepId]?.resolution) throw new PrayerEngineError("ابتدا گام جاری را حل کنید");
  const next = steps[index + 1];
  return next ? { ...session, currentStepId: next.id, updatedAt: now } : null;
}

/** Resolves the current step and advances in one domain transition. */
export function resolveAndAdvance(
  prayer: PrayerDefinition,
  session: PrayerSession,
  resolution: "completed" | "skipped",
  now = new Date().toISOString(),
): PrayerSession | null {
  return advanceSession(prayer, resolveCurrentStep(prayer, session, resolution, now), now);
}

/** Increments a counter and resolves/advances it on the tap that reaches its target. */
export function incrementCounterAndAdvance(
  prayer: PrayerDefinition,
  session: PrayerSession,
  now = new Date().toISOString(),
): PrayerSession | null {
  const step = currentStep(prayer, session);
  if (step.kind !== "counter") throw new PrayerEngineError("گام جاری شمارنده نیست");
  const counted = incrementCounter(prayer, session, now);
  return counted.stepStates[step.id]?.count === step.target
    ? resolveAndAdvance(prayer, counted, "completed", now)
    : counted;
}

/** Moves to an adjacent step. Moving forward skips an unresolved optional step. */
export function moveSessionStep(
  prayer: PrayerDefinition,
  session: PrayerSession,
  direction: "previous" | "next",
  now = new Date().toISOString(),
): PrayerSession | null {
  const steps = stepsForMode(prayer, session.modeId);
  const index = steps.findIndex((step) => step.id === session.currentStepId);
  if (index < 0) throw new PrayerEngineError("گام جاری پیدا نشد");
  const targetIndex = direction === "previous" ? index - 1 : index + 1;
  const target = steps[targetIndex];
  if (!target) throw new PrayerEngineError(direction === "previous" ? "گام قبلی وجود ندارد" : "گام بعدی وجود ندارد");

  if (direction === "next" && !session.stepStates[session.currentStepId]?.resolution) {
    const step = steps[index]!;
    if (!step.optional) throw new PrayerEngineError("گام اصلی قابل ردکردن نیست");
    return resolveAndAdvance(prayer, session, "skipped", now);
  }
  return { ...session, currentStepId: target.id, updatedAt: now };
}

export function sessionProgress(prayer: PrayerDefinition, session: PrayerSession): { solved: number; total: number; ratio: number } {
  const steps = stepsForMode(prayer, session.modeId);
  const solved = steps.filter((step) => session.stepStates[step.id]?.resolution != null).length;
  return { solved, total: steps.length, ratio: steps.length ? solved / steps.length : 0 };
}

export function isSessionCompatible(prayer: PrayerDefinition, session: PrayerSession): boolean {
  if (prayer.id !== session.prayerId || prayer.contentVersion !== session.contentVersion) return false;
  return stepsForMode(prayer, session.modeId).some((step) => step.id === session.currentStepId);
}
