import type {
  ContentBundle,
  ContentItem,
  LocalizedText,
  PrayerDefinition,
  PrayerStep,
} from "./types";

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

function textIssues(value: unknown, path: string): ValidationIssue[] {
  if (!value || typeof value !== "object") {
    return [{ path, message: "متن محلی‌سازی‌شده وجود ندارد" }];
  }
  const text = value as Partial<LocalizedText>;
  return (["fa", "ar"] as const).flatMap((locale) =>
    typeof text[locale] !== "string" || text[locale].trim().length === 0
      ? [{ path: `${path}.${locale}`, message: "ترجمه خالی است" }]
      : [],
  );
}

function duplicateIssues(values: readonly string[], path: string): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const value of values) {
    if (seen.has(value)) issues.push({ path, message: `شناسه تکراری: ${value}` });
    seen.add(value);
  }
  return issues;
}

function stepIssues(
  step: PrayerStep,
  path: string,
  contentIds: ReadonlySet<string>,
): ValidationIssue[] {
  const issues = [
    ...textIssues(step.title, `${path}.title`),
    ...(step.id.trim() ? [] : [{ path: `${path}.id`, message: "شناسه گام خالی است" }]),
  ];
  if (step.kind === "instruction") {
    issues.push(...textIssues(step.body, `${path}.body`));
  } else {
    if (!contentIds.has(step.contentId)) {
      issues.push({ path: `${path}.contentId`, message: `محتوای پیدا نشد: ${step.contentId}` });
    }
    if (step.kind === "counter" && (!Number.isInteger(step.target) || step.target < 1)) {
      issues.push({ path: `${path}.target`, message: "هدف شمارنده باید عدد صحیح مثبت باشد" });
    }
  }
  return issues;
}

function prayerIssues(
  prayer: PrayerDefinition,
  path: string,
  contentIds: ReadonlySet<string>,
  sourceIds: ReadonlySet<string>,
): ValidationIssue[] {
  const stageIds = prayer.stages.map((stage) => stage.id);
  const stageIdSet = new Set(stageIds);
  const allSteps = prayer.stages.flatMap((stage) => stage.steps);
  const issues: ValidationIssue[] = [
    ...textIssues(prayer.title, `${path}.title`),
    ...textIssues(prayer.description, `${path}.description`),
    ...duplicateIssues(stageIds, `${path}.stages`),
    ...duplicateIssues(allSteps.map((step) => step.id), `${path}.steps`),
  ];

  if (prayer.schemaVersion !== 1) issues.push({ path: `${path}.schemaVersion`, message: "نسخه schema پشتیبانی نمی‌شود" });
  if (!Number.isInteger(prayer.version) || prayer.version < 1) issues.push({ path: `${path}.version`, message: "نسخه نماز نامعتبر است" });
  if (!Number.isInteger(prayer.contentVersion) || prayer.contentVersion < 1) issues.push({ path: `${path}.contentVersion`, message: "نسخه محتوا نامعتبر است" });

  for (const sourceId of prayer.sourceIds) {
    if (!sourceIds.has(sourceId)) issues.push({ path: `${path}.sourceIds`, message: `منبع پیدا نشد: ${sourceId}` });
  }
  prayer.modes.forEach((mode, modeIndex) => {
    issues.push(...textIssues(mode.title, `${path}.modes[${modeIndex}].title`));
    issues.push(...textIssues(mode.description, `${path}.modes[${modeIndex}].description`));
    issues.push(...duplicateIssues(mode.stageIds, `${path}.modes[${modeIndex}].stageIds`));
    for (const stageId of mode.stageIds) {
      if (!stageIdSet.has(stageId)) issues.push({ path: `${path}.modes[${modeIndex}].stageIds`, message: `بخش پیدا نشد: ${stageId}` });
    }
  });
  issues.push(...duplicateIssues(prayer.modes.map((mode) => mode.id), `${path}.modes`));
  prayer.stages.forEach((stage, stageIndex) => {
    issues.push(...textIssues(stage.title, `${path}.stages[${stageIndex}].title`));
    stage.steps.forEach((step, stepIndex) => {
      issues.push(...stepIssues(step, `${path}.stages[${stageIndex}].steps[${stepIndex}]`, contentIds));
    });
  });
  return issues;
}

export function validateContentBundle(bundle: ContentBundle): ValidationIssue[] {
  const contentIds = new Set(bundle.items.map((item: ContentItem) => item.id));
  const sourceIds = new Set(bundle.sources.map((source) => source.id));
  const issues: ValidationIssue[] = [
    ...duplicateIssues(bundle.sources.map((source) => source.id), "sources"),
    ...duplicateIssues(bundle.items.map((item) => item.id), "items"),
    ...duplicateIssues(bundle.prayers.map((prayer) => prayer.id), "prayers"),
  ];

  if (bundle.schemaVersion !== 1) issues.push({ path: "schemaVersion", message: "نسخه schema پشتیبانی نمی‌شود" });
  if (!Number.isInteger(bundle.contentVersion) || bundle.contentVersion < 1) issues.push({ path: "contentVersion", message: "نسخه محتوا نامعتبر است" });
  bundle.sources.forEach((source, index) => {
    issues.push(...textIssues(source.title, `sources[${index}].title`));
    if (!source.url.startsWith("https://")) issues.push({ path: `sources[${index}].url`, message: "نشانی منبع باید HTTPS باشد" });
  });
  bundle.items.forEach((item, index) => {
    issues.push(...textIssues(item.title, `items[${index}].title`));
    issues.push(...textIssues(item.text, `items[${index}].text`));
    for (const sourceId of item.sourceIds) {
      if (!sourceIds.has(sourceId)) issues.push({ path: `items[${index}].sourceIds`, message: `منبع پیدا نشد: ${sourceId}` });
    }
  });
  bundle.prayers.forEach((prayer, index) => {
    issues.push(...prayerIssues(prayer, `prayers[${index}]`, contentIds, sourceIds));
  });
  return issues;
}

export function assertValidContentBundle(bundle: ContentBundle): void {
  const issues = validateContentBundle(bundle);
  if (issues.length) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }
}
