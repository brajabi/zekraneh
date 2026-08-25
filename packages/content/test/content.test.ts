import { describe, expect, test } from "bun:test";
import { stepsForMode, validateContentBundle, type ContentBundle } from "@zekraneh/domain";
import { contentBundle, nightPrayer, ziyaratAshura } from "../src";

describe("اعتبارسنجی محتوا", () => {
  test("بسته اصلی معتبر است", () => {
    expect(validateContentBundle(contentBundle)).toEqual([]);
  });

  test("contentId گمشده را گزارش می‌کند", () => {
    const broken = structuredClone(contentBundle) as ContentBundle;
    const firstStage = broken.prayers[0]?.stages[0];
    const recitation = firstStage?.steps.find((step) => step.kind === "recitation");
    if (!recitation || recitation.kind !== "recitation") throw new Error("fixture ناقص است");
    (recitation as { contentId: string }).contentId = "missing";
    expect(validateContentBundle(broken).some((issue) => issue.message.includes("محتوای پیدا نشد"))).toBeTrue();
  });

  test("شناسه تکراری، ترجمه ناقص و target نامعتبر را گزارش می‌کند", () => {
    const broken = structuredClone(contentBundle) as ContentBundle;
    const mutableItems = broken.items as Array<(typeof broken.items)[number]>;
    mutableItems.push(structuredClone(mutableItems[0]!));
    (mutableItems[0]!.title as { fa: string }).fa = "";
    const counter = broken.prayers[0]?.stages.flatMap((stage) => stage.steps).find((step) => step.kind === "counter");
    if (!counter || counter.kind !== "counter") throw new Error("fixture ناقص است");
    (counter as { target: number }).target = 0;
    const messages = validateContentBundle(broken).map((issue) => issue.message);
    expect(messages.some((message) => message.includes("شناسه تکراری"))).toBeTrue();
    expect(messages.some((message) => message.includes("ترجمه خالی"))).toBeTrue();
    expect(messages.some((message) => message.includes("هدف شمارنده"))).toBeTrue();
  });
});

describe("ترتیب حالت‌های نماز شب", () => {
  test("سه حالت بخش‌های دقیق خود را دارند", () => {
    expect(nightPrayer.modes.map((mode) => [mode.id, ...mode.stageIds])).toEqual([
      ["complete", "nafila-1", "nafila-2", "nafila-3", "nafila-4", "shaf", "witr"],
      ["shaf-witr", "shaf", "witr"],
      ["witr-only", "witr"],
    ]);
  });

  test("وتر ترتیب درخواستی حمد، سه توحید، ناس، فلق و ذکرها را دارد", () => {
    expect(
      stepsForMode(nightPrayer, "witr-only")
        .filter((step) => step.kind !== "instruction")
        .map((step) => step.id),
    ).toEqual([
      "witr-fatiha",
      "witr-ikhlas-3",
      "witr-nas",
      "witr-falaq",
      "witr-istighfar-70",
      "witr-believers-40",
      "witr-refuge-7",
      "witr-afw-300",
      "witr-after-ruku",
    ]);
    expect(
      stepsForMode(nightPrayer, "witr-only")
        .filter((step) => step.kind === "counter")
        .map((step) => step.target),
    ).toEqual([3, 70, 40, 7, 300]);
  });

  test("زیارت عاشورا با صد لعن و صد سلام در بسته وجود دارد", () => {
    expect(contentBundle.prayers.map((worship) => worship.id)).toContain("ziyarat-ashura");
    expect(
      stepsForMode(ziyaratAshura, "complete")
        .filter((step) => step.kind === "counter")
        .map((step) => step.target),
    ).toEqual([100, 100]);
  });
});
