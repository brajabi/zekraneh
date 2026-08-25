export type Locale = "fa" | "ar";

export type LocalizedText = Readonly<Record<Locale, string>>;

export type ContentKind = "surah" | "dua" | "dhikr";

export interface ContentSource {
  readonly id: string;
  readonly title: LocalizedText;
  readonly url: string;
  readonly reviewed: boolean;
}

export interface ContentItem {
  readonly id: string;
  readonly kind: ContentKind;
  readonly sourceIds: readonly string[];
  readonly title: LocalizedText;
  readonly text: LocalizedText;
}

interface BasePrayerStep {
  readonly id: string;
  readonly title: LocalizedText;
  readonly optional: boolean;
}

export interface InstructionStep extends BasePrayerStep {
  readonly kind: "instruction";
  readonly body: LocalizedText;
}

export interface RecitationStep extends BasePrayerStep {
  readonly kind: "recitation";
  readonly contentId: string;
}

export interface CounterStep extends BasePrayerStep {
  readonly kind: "counter";
  readonly contentId: string;
  readonly target: number;
}

export type PrayerStep = InstructionStep | RecitationStep | CounterStep;

export interface PrayerMode {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly stageIds: readonly string[];
}

export interface PrayerStage {
  readonly id: string;
  readonly title: LocalizedText;
  readonly steps: readonly PrayerStep[];
}

export interface PrayerDefinition {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: number;
  readonly contentVersion: number;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly sourceIds: readonly string[];
  readonly modes: readonly PrayerMode[];
  readonly stages: readonly PrayerStage[];
}

export interface ContentBundle {
  readonly schemaVersion: 1;
  readonly contentVersion: number;
  readonly sources: readonly ContentSource[];
  readonly items: readonly ContentItem[];
  readonly prayers: readonly PrayerDefinition[];
}

export type StepResolution = "completed" | "skipped";

export interface SessionStepState {
  readonly stepId: string;
  readonly count: number;
  readonly resolution: StepResolution | null;
  readonly updatedAt: string;
}

export interface PrayerSession {
  readonly id: string;
  readonly prayerId: string;
  readonly prayerVersion: number;
  readonly contentVersion: number;
  readonly modeId: string;
  readonly currentStepId: string;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly stepStates: Readonly<Record<string, SessionStepState>>;
}

export interface WorshipCompletion {
  readonly id: string;
  readonly worshipId: string;
  readonly modeId: string;
  readonly completedAt: string;
}

export interface AppSettings {
  readonly locale: Locale;
  readonly theme: "system" | "light" | "dark";
  readonly hapticsEnabled: boolean;
  readonly keepAwakeEnabled: boolean;
  readonly showPersianTranslation: boolean;
}
