import { worshipsById } from "@zekraneh/content";
import {
  buildPersianMonth,
  persianDateKey,
  persianDateParts,
  sessionProgress,
  shiftPersianMonth,
  toPersianDigits,
  type WorshipCompletion,
} from "@zekraneh/domain";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

const MONTHS_FA = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const MONTHS_AR = ["فروردين", "أرديبهشت", "خرداد", "تير", "مرداد", "شهريور", "مهر", "آبان", "آذر", "دي", "بهمن", "إسفند"];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export default function MyWorshipsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, session, completions, incompatibleSession, restartIncompatibleSession } = useApp();
  const locale = settings.locale;
  const activeWorship = session ? worshipsById.get(session.prayerId) : undefined;
  const progress = session && activeWorship ? sessionProgress(activeWorship, session) : null;
  const mode = session && activeWorship ? activeWorship.modes.find((candidate) => candidate.id === session.modeId) : undefined;
  const percent = progress ? Math.round(progress.ratio * 100) : 0;

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>{locale === "fa" ? "عبادت‌های من" : "عباداتي"}</Text>

      {session && incompatibleSession ? (
        <AppCard className="gap-3">
          <Text style={[styles.title, { color: colors.danger }]}>{locale === "fa" ? "این جلسه با نسخهٔ جدید سازگار نیست" : "هذه الجلسة غير متوافقة مع الإصدار الجديد"}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{locale === "fa" ? "جلسهٔ قدیمی را پاک کنید و دوباره آغاز کنید." : "احذف الجلسة القديمة وابدأ من جديد."}</Text>
          <AppButton label={locale === "fa" ? "پاک کردن جلسه" : "حذف الجلسة"} variant="outline" onPress={() => void restartIncompatibleSession()} />
        </AppCard>
      ) : session && activeWorship && progress ? (
        <AppCard className="gap-3">
          <View style={styles.cardTop}>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.text }]}>{activeWorship.title[locale]}</Text>
              <Text style={[styles.cardDescription, { color: colors.textMuted }]}>{mode?.title[locale]}</Text>
            </View>
            <Text style={[styles.percent, { color: colors.accent }]}>{toPersianDigits(percent)}٪</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { backgroundColor: colors.primary, width: `${percent}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {locale === "fa"
              ? `${toPersianDigits(progress.solved)} از ${toPersianDigits(progress.total)} گام انجام شده`
              : `${toPersianDigits(progress.solved)} من ${toPersianDigits(progress.total)} خطوة مكتملة`}
          </Text>
          <AppButton fullWidth label={locale === "fa" ? "ادامهٔ عبادت" : "متابعة العبادة"} onPress={() => router.push("/session")} />
        </AppCard>
      ) : (
        <AppCard className="items-center gap-2">
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}><Text style={[styles.emptyMoon, { color: colors.accent }]}>☾</Text></View>
          <Text style={[styles.title, { color: colors.text }]}>{locale === "fa" ? "عبادت فعالی ندارید" : "لا توجد عبادة نشطة"}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{locale === "fa" ? "از فهرست عبادت‌ها یک مورد را آغاز کنید." : "ابدأ عبادة من قائمة العبادات."}</Text>
          <AppButton label={locale === "fa" ? "رفتن به عبادت‌ها" : "الذهاب إلى العبادات"} variant="outline" onPress={() => router.replace("/")} />
        </AppCard>
      )}

      <WorshipCalendar completions={completions} locale={locale} />
    </Screen>
  );
}

function WorshipCalendar({ completions, locale }: { readonly completions: readonly WorshipCompletion[]; readonly locale: "fa" | "ar" }) {
  const { colors } = useAppTheme();
  const today = useMemo(() => persianDateParts(new Date()), []);
  const todayKey = useMemo(() => persianDateKey(new Date()), []);
  const [shownMonth, setShownMonth] = useState({ year: today.year, month: today.month });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const days = useMemo(() => buildPersianMonth(shownMonth.year, shownMonth.month), [shownMonth]);
  const completionsByDay = useMemo(() => {
    const grouped = new Map<string, WorshipCompletion[]>();
    for (const completion of completions) {
      const key = persianDateKey(completion.completedAt);
      grouped.set(key, [...(grouped.get(key) ?? []), completion]);
    }
    return grouped;
  }, [completions]);
  const selectedCompletions = selectedKey ? completionsByDay.get(selectedKey) ?? [] : [];
  const selectedParts = selectedKey?.split("-").map(Number);
  const monthNames = locale === "fa" ? MONTHS_FA : MONTHS_AR;

  const shift = (delta: number) => setShownMonth((current) => shiftPersianMonth(current.year, current.month, delta));

  return (
    <>
      <AppCard className="gap-3" style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel={locale === "fa" ? "ماه قبل" : "الشهر السابق"} onPress={() => shift(-1)} style={[styles.calendarArrow, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
          </Pressable>
          <Text style={[styles.calendarTitle, { color: colors.text }]}>{monthNames[shownMonth.month - 1]} {toPersianDigits(shownMonth.year)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={locale === "fa" ? "ماه بعد" : "الشهر التالي"} onPress={() => shift(1)} style={[styles.calendarArrow, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.arrowText, { color: colors.primary }]}>←</Text>
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday, index) => <Text key={`${weekday}-${index}`} style={[styles.weekday, { color: colors.textMuted }]}>{weekday}</Text>)}
        </View>
        <View style={styles.daysGrid}>
          {Array.from({ length: days[0]?.weekDay ?? 0 }, (_, index) => <View key={`empty-${index}`} style={styles.dayCell} />)}
          {days.map((day) => {
            const key = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
            const hasCompletion = completionsByDay.has(key);
            const isToday = key === todayKey;
            return (
              <View key={key} style={styles.dayCell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${toPersianDigits(day.day)} ${monthNames[day.month - 1]}${hasCompletion ? (locale === "fa" ? "، عبادت انجام شده" : "، عبادة مكتملة") : ""}`}
                  onPress={() => setSelectedKey(key)}
                  style={({ pressed }) => [
                    styles.dayButton,
                    {
                      backgroundColor: hasCompletion ? colors.accent : "transparent",
                      borderColor: isToday ? colors.primary : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { color: hasCompletion ? colors.background : colors.text }]}>{toPersianDigits(day.day)}</Text>
                  {hasCompletion ? <View style={[styles.dayDot, { backgroundColor: colors.background }]} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
        <Text style={[styles.calendarHint, { color: colors.textMuted }]}>{locale === "fa" ? "روزهای زعفرانی عبادت ثبت‌شده دارند." : "الأيام الزعفرانية تحتوي على عبادة مسجلة."}</Text>
      </AppCard>

      <Modal visible={selectedKey != null} transparent animationType="slide" onRequestClose={() => setSelectedKey(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectedKey(null)}>
          <Pressable accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {selectedParts ? `${toPersianDigits(selectedParts[2]!)} ${monthNames[selectedParts[1]! - 1]} ${toPersianDigits(selectedParts[0]!)}` : ""}
            </Text>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetList}>
              {selectedCompletions.length > 0 ? selectedCompletions.map((completion) => {
                const worship = worshipsById.get(completion.worshipId);
                const completedMode = worship?.modes.find((candidate) => candidate.id === completion.modeId);
                const time = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(completion.completedAt));
                return (
                  <View key={completion.id} style={[styles.completionRow, { borderColor: colors.border }]}>
                    <View style={styles.copy}>
                      <Text style={[styles.completionTitle, { color: colors.text }]}>{worship?.title[locale] ?? completion.worshipId}</Text>
                      <Text style={[styles.completionMeta, { color: colors.textMuted }]}>{completedMode?.title[locale]}</Text>
                    </View>
                    <Text style={[styles.completionTime, { color: colors.accent }]}>{toPersianDigits(time)}</Text>
                  </View>
                );
              }) : (
                <Text style={[styles.noCompletion, { color: colors.textMuted }]}>{locale === "fa" ? "در این روز عبادتی ثبت نشده است." : "لا توجد عبادة مسجلة في هذا اليوم."}</Text>
              )}
            </ScrollView>
            <AppButton fullWidth label={locale === "fa" ? "بستن" : "إغلاق"} variant="outline" onPress={() => setSelectedKey(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 12, paddingTop: 18 },
  pageTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 18, textAlign: "right" },
  title: { fontFamily: "Vazirmatn_700Bold", fontSize: 16, textAlign: "right" },
  description: { fontFamily: "Vazirmatn_400Regular", fontSize: 12.5, lineHeight: 21, textAlign: "center" },
  cardDescription: { fontFamily: "Vazirmatn_400Regular", fontSize: 13, lineHeight: 21, textAlign: "right" },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  emptyMoon: { fontSize: 27, lineHeight: 34 },
  cardTop: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 12 },
  copy: { flex: 1, gap: 2 },
  percent: { fontFamily: "Vazirmatn_700Bold", fontSize: 20 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  progressText: { fontFamily: "Vazirmatn_400Regular", fontSize: 12, textAlign: "right" },
  calendarCard: { width: "100%", maxWidth: 520, alignSelf: "center" },
  calendarHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  calendarArrow: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  arrowText: { fontFamily: "Vazirmatn_700Bold", fontSize: 18 },
  calendarTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 15 },
  weekRow: { flexDirection: "row-reverse" },
  weekday: { width: "14.2857%", fontFamily: "Vazirmatn_500Medium", fontSize: 11, textAlign: "center" },
  daysGrid: { flexDirection: "row-reverse", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", minHeight: 46, alignItems: "center", justifyContent: "center" },
  dayButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  dayText: { fontFamily: "Vazirmatn_500Medium", fontSize: 12 },
  dayDot: { position: "absolute", bottom: 4, width: 3, height: 3, borderRadius: 2 },
  calendarHint: { fontFamily: "Vazirmatn_400Regular", fontSize: 10.5, textAlign: "right" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.46)", justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxWidth: 620, maxHeight: "62%", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 12 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 17, textAlign: "right" },
  sheetScroll: { flexGrow: 0 },
  sheetList: { gap: 8 },
  completionRow: { minHeight: 58, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  completionTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 13, textAlign: "right" },
  completionMeta: { fontFamily: "Vazirmatn_400Regular", fontSize: 11, textAlign: "right" },
  completionTime: { fontFamily: "Vazirmatn_700Bold", fontSize: 12 },
  noCompletion: { fontFamily: "Vazirmatn_400Regular", fontSize: 13, lineHeight: 22, textAlign: "center", paddingVertical: 18 },
});
