import { contentItemsById, worshipsById } from "@zekraneh/content";
import { toPersianDigits, stepsForMode, type PrayerStage } from "@zekraneh/domain";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "@/components/screen";
import { AppButton } from "@/components/ui/app-button";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

const KEEP_AWAKE_TAG = "zekraneh-active-session";

export default function SessionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, session, incompatibleSession, increment, decrement, reset, resolve, navigateStep } = useApp();
  const locale = settings.locale;
  const [translationStepId, setTranslationStepId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !session || !settings.keepAwakeEnabled) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => { void deactivateKeepAwake(KEEP_AWAKE_TAG); };
  }, [session, settings.keepAwakeEnabled]);

  const worship = session ? worshipsById.get(session.prayerId) : undefined;
  const steps = useMemo(() => session && worship ? stepsForMode(worship, session.modeId) : [], [session, worship]);
  const currentIndex = session ? steps.findIndex((candidate) => candidate.id === session.currentStepId) : -1;
  const step = currentIndex >= 0 ? steps[currentIndex] : undefined;
  const stages = useMemo(() => {
    if (!session) return [];
    if (!worship) return [];
    const mode = worship.modes.find((candidate) => candidate.id === session.modeId);
    return mode?.stageIds
      .map((stageId) => worship.stages.find((candidate) => candidate.id === stageId))
      .filter((candidate): candidate is PrayerStage => candidate != null) ?? [];
  }, [session, worship]);

  if (!session) {
    return (
      <Screen contentStyle={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{locale === "fa" ? "جلسهٔ فعالی وجود ندارد" : "لا توجد جلسة نشطة"}</Text>
        <AppButton label={locale === "fa" ? "رفتن به عبادت‌های من" : "الذهاب إلى عباداتي"} onPress={() => router.replace("/mine")} />
      </Screen>
    );
  }

  if (incompatibleSession || !worship || !step) {
    return (
      <Screen contentStyle={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.danger }]}>{locale === "fa" ? "ادامهٔ این جلسه ممکن نیست" : "لا يمكن متابعة هذه الجلسة"}</Text>
        <AppButton label={locale === "fa" ? "بازگشت" : "رجوع"} onPress={() => router.replace("/mine")} />
      </Screen>
    );
  }

  const state = session.stepStates[step.id];
  const content = step.kind === "instruction" ? null : contentItemsById.get(step.contentId);
  const currentStage = stages.find((stage) => stage.steps.some((candidate) => candidate.id === step.id));
  const isLast = currentIndex === steps.length - 1;
  const translationOpen = settings.showPersianTranslation && translationStepId === step.id;
  const shortDhikr = content?.kind === "dhikr";
  const count = step.kind === "counter" ? (state?.count ?? 0) : 0;
  const showStepNavigation = step.kind === "counter" && step.target >= 40;

  const finishIfNeeded = () => {
    if (isLast) router.replace("/mine");
  };

  const complete = (resolution: "completed" | "skipped") => {
    resolve(resolution);
    finishIfNeeded();
  };

  const countOnce = () => {
    if (step.kind !== "counter" || count >= step.target) return;
    const reachesTarget = count + 1 >= step.target;
    if (settings.hapticsEnabled && Platform.OS !== "web") {
      if (reachesTarget) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else void Haptics.selectionAsync();
    }
    increment();
    if (reachesTarget) finishIfNeeded();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={[styles.stageName, { color: colors.text }]}>{currentStage?.title[locale]}</Text>
          <Text numberOfLines={1} style={[styles.stepName, { color: colors.textMuted }]}>{step.title[locale]}</Text>
        </View>
        <Text style={[styles.stepCount, { color: colors.accent }]}>
          {locale === "fa"
            ? `${toPersianDigits(currentIndex + 1)} از ${toPersianDigits(steps.length)}`
            : `${toPersianDigits(currentIndex + 1)} من ${toPersianDigits(steps.length)}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={locale === "fa" ? "خروج از نماز" : "الخروج من الصلاة"}
          onPress={() => router.replace("/mine")}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.closeIcon, { color: colors.text }]}>×</Text>
        </Pressable>
      </View>

      {showStepNavigation ? (
        <View style={[styles.stepNavigation, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <AppButton
            label={locale === "fa" ? "گام قبلی" : "الخطوة السابقة"}
            variant="outline"
            isDisabled={currentIndex === 0}
            onPress={() => navigateStep("previous")}
          />
          <AppButton
            label={locale === "fa" ? "گام بعدی" : "الخطوة التالية"}
            variant="outline"
            isDisabled={currentIndex === steps.length - 1}
            onPress={() => navigateStep("next")}
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.titleRow}>
          {step.optional ? <Text style={[styles.optional, { color: colors.accent }]}>{locale === "fa" ? "مستحب" : "مستحب"}</Text> : null}
          <Text style={[styles.title, { color: colors.text }]}>{step.title[locale]}</Text>
        </View>

        {step.kind === "instruction" ? (
          <Text selectable style={[styles.instruction, { color: colors.text }]}>{step.body[locale]}</Text>
        ) : content ? (
          <View style={styles.recitationBlock}>
            <Text selectable style={[styles.arabic, shortDhikr && styles.centeredText, { color: colors.text }]}>{content.text.ar}</Text>
            {settings.showPersianTranslation ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={translationOpen ? (locale === "fa" ? "بستن ترجمهٔ فارسی" : "إخفاء الترجمة الفارسية") : (locale === "fa" ? "نمایش ترجمهٔ فارسی" : "إظهار الترجمة الفارسية")}
                  onPress={() => setTranslationStepId(translationOpen ? null : step.id)}
                  style={({ pressed }) => [styles.translationToggle, { borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.translationToggleText, { color: colors.primary }]}>
                    {translationOpen ? (locale === "fa" ? "بستن ترجمه" : "إخفاء الترجمة") : (locale === "fa" ? "نمایش ترجمهٔ فارسی" : "إظهار الترجمة الفارسية")}
                  </Text>
                </Pressable>
                {translationOpen ? <Text selectable style={[styles.translation, shortDhikr && styles.centeredText, { color: colors.textMuted }]}>{content.text.fa}</Text> : null}
              </>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.instruction, { color: colors.danger }]}>{locale === "fa" ? "متن این گام پیدا نشد." : "لم يتم العثور على نص هذه الخطوة."}</Text>
        )}
      </ScrollView>

      <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {step.kind === "counter" ? (
          <>
            <View style={styles.counterRow}>
              <IconControl label={locale === "fa" ? "یک واحد کم کردن" : "إنقاص واحدة"} glyph="−" disabled={count === 0} onPress={decrement} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locale === "fa" ? `شمارندهٔ ${step.title.fa}` : `عداد ${step.title.ar}`}
                accessibilityHint={locale === "fa" ? "برای افزودن یک واحد دو ضربه بزنید" : "اضغط مرتين لإضافة واحدة"}
                accessibilityValue={{ min: 0, max: step.target, now: count }}
                onPress={countOnce}
                style={({ pressed }) => [styles.counter, { backgroundColor: colors.primaryStrong, borderColor: colors.accent, opacity: pressed ? 0.86 : 1 }]}
              >
                <Text style={styles.counterNumber}>{toPersianDigits(count)}</Text>
                <Text style={styles.counterTarget}>/ {toPersianDigits(step.target)}</Text>
              </Pressable>
              <IconControl label={locale === "fa" ? "بازنشانی شمارنده" : "إعادة ضبط العدّاد"} glyph="↺" disabled={count === 0} onPress={reset} />
            </View>
            {step.optional ? <AppButton fullWidth label={locale === "fa" ? "کمتر خواندم" : "قرأت أقل"} variant="ghost" onPress={() => complete("skipped")} /> : null}
          </>
        ) : (
          <View style={styles.actionRow}>
            <AppButton
              fullWidth={!step.optional}
              className={step.optional ? "flex-1" : undefined}
              label={step.kind === "recitation" ? (locale === "fa" ? "خواندم" : "قرأت") : (locale === "fa" ? "انجام شد" : "تمّ")}
              onPress={() => complete("completed")}
            />
            {step.optional ? <AppButton className="flex-1" label={locale === "fa" ? "رد کردن مستحب" : "تخطي المستحب"} variant="outline" onPress={() => complete("skipped")} /> : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function IconControl({ label, glyph, disabled, onPress }: { readonly label: string; readonly glyph: string; readonly disabled: boolean; readonly onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.iconControl, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: disabled ? 0.38 : pressed ? 0.68 : 1 }]}
    >
      <Text style={[styles.iconControlText, { color: colors.primary }]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  empty: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 18, textAlign: "center" },
  header: { minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 5, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  headerCopy: { flex: 1, gap: 0 },
  stageName: { fontFamily: "Vazirmatn_700Bold", fontSize: 13, lineHeight: 20, textAlign: "right" },
  stepName: { fontFamily: "Vazirmatn_400Regular", fontSize: 11, lineHeight: 17, textAlign: "right" },
  stepCount: { fontFamily: "Vazirmatn_700Bold", fontSize: 11.5 },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  closeIcon: { fontFamily: "Vazirmatn_400Regular", fontSize: 26, lineHeight: 31 },
  stepNavigation: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 4, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 8 },
  contentScroll: { flex: 1 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  titleRow: { gap: 2 },
  optional: { fontFamily: "Vazirmatn_500Medium", fontSize: 11, textAlign: "right" },
  title: { fontFamily: "Vazirmatn_700Bold", fontSize: 17, lineHeight: 28, textAlign: "right" },
  instruction: { fontFamily: "Vazirmatn_400Regular", fontSize: 15, lineHeight: 29, textAlign: "right", writingDirection: "rtl" },
  recitationBlock: { gap: 12 },
  arabic: { fontFamily: "NotoNaskhArabic_400Regular", fontSize: 24, lineHeight: 43, textAlign: "right", writingDirection: "rtl" },
  centeredText: { textAlign: "center" },
  translationToggle: { minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11, justifyContent: "center" },
  translationToggleText: { fontFamily: "Vazirmatn_500Medium", fontSize: 12, textAlign: "right" },
  translation: { fontFamily: "Vazirmatn_400Regular", fontSize: 13, lineHeight: 25, textAlign: "right", writingDirection: "rtl" },
  controls: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 8, gap: 5, alignItems: "center" },
  counterRow: { width: "100%", maxWidth: 360, flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 12 },
  counter: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  counterNumber: { color: "#FFFFFF", fontFamily: "Vazirmatn_700Bold", fontSize: 34, lineHeight: 42 },
  counterTarget: { color: "#E6EAF4", fontFamily: "Vazirmatn_500Medium", fontSize: 12, lineHeight: 18 },
  iconControl: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  iconControlText: { fontFamily: "Vazirmatn_500Medium", fontSize: 24, lineHeight: 30 },
  actionRow: { width: "100%", maxWidth: 640, flexDirection: "row-reverse", alignItems: "center", gap: 8 },
});
