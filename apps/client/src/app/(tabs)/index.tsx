import { worships } from "@zekraneh/content";
import { toPersianDigits } from "@zekraneh/domain";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "@/components/brand-mark";
import { Screen } from "@/components/screen";
import { AppCard } from "@/components/ui/app-card";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

export default function WorshipsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings } = useApp();
  const locale = settings.locale;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.brandBlock}>
        <BrandMark />
        <View style={styles.brandCopy}>
          <Text style={[styles.brand, { color: colors.text }]}>{locale === "fa" ? "ذکرانه" : "ذِكرانة"}</Text>
          <Text numberOfLines={1} style={[styles.tagline, { color: colors.textMuted }]}>
            {locale === "fa" ? "همراه آفلاین و قدم‌به‌قدم عبادت" : "رفيق عبادة دون اتصال، خطوة بخطوة"}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{locale === "fa" ? "عبادت‌ها" : "العبادات"}</Text>
      {worships.map((worship) => (
        <Pressable
          key={worship.id}
          accessibilityRole="button"
          accessibilityLabel={worship.title[locale]}
          onPress={() => router.push({ pathname: "/prayer/[id]", params: { id: worship.id } })}
          style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
        >
          <AppCard className="gap-3">
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>{worship.id === "night-prayer" ? toPersianDigits(11) : "ع"}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{worship.title[locale]}</Text>
                <Text numberOfLines={2} style={[styles.body, { color: colors.textMuted }]}>{worship.description[locale]}</Text>
              </View>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {locale === "fa" ? `${toPersianDigits(worship.modes.length)} حالت اجرا` : `${toPersianDigits(worship.modes.length)} طرق للأداء`}
              </Text>
              <Text style={[styles.open, { color: colors.primary }]}>{locale === "fa" ? "مشاهده ←" : "عرض ←"}</Text>
            </View>
          </AppCard>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 14, paddingTop: 18 },
  brandBlock: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 4 },
  brandCopy: { flex: 1, gap: 1 },
  brand: { fontFamily: "Vazirmatn_700Bold", fontSize: 20, lineHeight: 29, textAlign: "right" },
  tagline: { fontFamily: "Vazirmatn_400Regular", fontSize: 12, lineHeight: 19, textAlign: "right" },
  sectionTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 17, textAlign: "right" },
  cardHeader: { flexDirection: "row-reverse", gap: 12, alignItems: "center" },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 18, textAlign: "right" },
  body: { fontFamily: "Vazirmatn_400Regular", fontSize: 13, lineHeight: 22, textAlign: "right" },
  badge: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: "Vazirmatn_700Bold", fontSize: 16 },
  cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, flexDirection: "row-reverse", justifyContent: "space-between" },
  meta: { fontFamily: "Vazirmatn_400Regular", fontSize: 12 },
  open: { fontFamily: "Vazirmatn_700Bold", fontSize: 12 },
});
