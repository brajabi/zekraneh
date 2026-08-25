import { worships, worshipsById } from "@zekraneh/content";
import { toPersianDigits } from "@zekraneh/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { AppButton } from "@/components/ui/app-button";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

export function generateStaticParams() {
  return worships.map((worship) => ({ id: worship.id }));
}

export default function PrayerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, session, startSession } = useApp();
  const locale = settings.locale;

  const worship = id ? worshipsById.get(id) : undefined;
  if (!worship) {
    return <Screen><Text style={[styles.title, { color: colors.danger }]}>{locale === "fa" ? "نماز پیدا نشد" : "لم يتم العثور على الصلاة"}</Text></Screen>;
  }

  const begin = async (modeId: string) => {
    if (session) {
      Alert.alert(
        locale === "fa" ? "جایگزینی جلسه فعال؟" : "استبدال الجلسة النشطة؟",
        locale === "fa" ? "با شروع این حالت، پیشرفت جلسه فعلی پاک می‌شود." : "عند بدء هذا الوضع سيُحذف تقدم الجلسة الحالية.",
        [
          { text: locale === "fa" ? "انصراف" : "إلغاء", style: "cancel" },
          {
            text: locale === "fa" ? "جایگزین کن" : "استبدال",
            style: "destructive",
            onPress: () => void startSession(worship.id, modeId, true).then((started) => started && router.replace("/session")),
          },
        ],
      );
      return;
    }
    if (await startSession(worship.id, modeId)) router.push("/session");
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{worship.title[locale]}</Text>
          <Text numberOfLines={1} style={[styles.description, { color: colors.textMuted }]}>{worship.description[locale]}</Text>
        </View>
        {session ? <AppButton label={locale === "fa" ? "ادامه" : "متابعة"} onPress={() => router.push("/session")} /> : null}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{locale === "fa" ? "یک حالت را انتخاب کنید" : "اختر طريقة الأداء"}</Text>
      <View style={styles.modeGrid}>
        {worship.modes.map((mode, index) => (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityLabel={`${mode.title[locale]}، ${mode.description[locale]}`}
            onPress={() => void begin(mode.id)}
            style={({ pressed }) => [
              styles.modeRow,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <View style={[styles.modeNumber, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.modeNumberText, { color: colors.accent }]}>{toPersianDigits(index + 1)}</Text>
            </View>
            <View style={styles.modeCopy}>
              <Text style={[styles.modeTitle, { color: colors.text }]}>{mode.title[locale]}</Text>
              <Text numberOfLines={1} style={[styles.modeDescription, { color: colors.textMuted }]}>{mode.description[locale]}</Text>
            </View>
            <View style={styles.modeTail}>
              <Text style={[styles.modeMeta, { color: colors.accent }]}>
                {locale === "fa" ? `${toPersianDigits(mode.stageIds.length)} بخش` : `${toPersianDigits(mode.stageIds.length)} أقسام`}
              </Text>
              <Text style={[styles.chevron, { color: colors.primary }]}>←</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 12, paddingTop: 14 },
  headerRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  header: { flex: 1, gap: 2 },
  title: { fontFamily: "Vazirmatn_700Bold", fontSize: 20, lineHeight: 31, textAlign: "right" },
  description: { fontFamily: "Vazirmatn_400Regular", fontSize: 12, lineHeight: 20, textAlign: "right" },
  sectionTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 14, textAlign: "right", marginTop: 2 },
  modeGrid: { gap: 8 },
  modeRow: { minHeight: 82, borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: "row-reverse", gap: 10, alignItems: "center" },
  modeNumber: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  modeNumberText: { fontFamily: "Vazirmatn_700Bold", fontSize: 14 },
  modeCopy: { flex: 1, gap: 2 },
  modeTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 15, textAlign: "right" },
  modeDescription: { fontFamily: "Vazirmatn_400Regular", fontSize: 11.5, lineHeight: 19, textAlign: "right" },
  modeTail: { alignItems: "center", gap: 2 },
  modeMeta: { fontFamily: "Vazirmatn_500Medium", fontSize: 10.5, textAlign: "center" },
  chevron: { fontFamily: "Vazirmatn_700Bold", fontSize: 16 },
});
