import { StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const { colors } = useAppTheme();
  const fa = settings.locale === "fa";

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>{fa ? "تنظیمات" : "الإعدادات"}</Text>
      <AppCard className="gap-3">
        <Text style={[styles.title, { color: colors.text }]}>{fa ? "زبان" : "اللغة"}</Text>
        <View style={styles.row}>
          <AppButton label="فارسی" variant={settings.locale === "fa" ? "primary" : "outline"} onPress={() => updateSettings({ ...settings, locale: "fa" })} />
          <AppButton label="العربية" variant={settings.locale === "ar" ? "primary" : "outline"} onPress={() => updateSettings({ ...settings, locale: "ar" })} />
        </View>
      </AppCard>

      <AppCard className="gap-3">
        <Text style={[styles.title, { color: colors.text }]}>{fa ? "پوسته" : "المظهر"}</Text>
        <View style={styles.row}>
          {(["system", "light", "dark"] as const).map((theme) => (
            <AppButton
              key={theme}
              label={fa ? ({ system: "خودکار", light: "روشن", dark: "تیره" }[theme]) : ({ system: "تلقائي", light: "فاتح", dark: "داكن" }[theme])}
              variant={settings.theme === theme ? "primary" : "outline"}
              onPress={() => updateSettings({ ...settings, theme })}
            />
          ))}
        </View>
      </AppCard>

      <AppCard className="gap-0">
        <SettingSwitch
          title={fa ? "نمایش ترجمهٔ فارسی در نماز" : "إظهار الترجمة الفارسية في الصلاة"}
          description={fa ? "دکمهٔ ترجمه در هر گام، به‌صورت بسته نمایش داده شود." : "يظهر زر الترجمة في كل خطوة وهو مغلق افتراضياً."}
          value={settings.showPersianTranslation}
          onValueChange={(value) => updateSettings({ ...settings, showPersianTranslation: value })}
        />
        <Divider color={colors.border} />
        <SettingSwitch
          title={fa ? "بازخورد لمسی شمارنده" : "الاهتزاز عند العدّ"}
          description={fa ? "لرزش ملایم هنگام شمارش و پایان." : "اهتزاز خفيف عند العدّ والانتهاء."}
          value={settings.hapticsEnabled}
          onValueChange={(value) => updateSettings({ ...settings, hapticsEnabled: value })}
        />
        <Divider color={colors.border} />
        <SettingSwitch
          title={fa ? "روشن ماندن صفحه" : "إبقاء الشاشة مضاءة"}
          description={fa ? "هنگام اجرای نماز صفحه خاموش نشود." : "تبقى الشاشة مضاءة أثناء الصلاة."}
          value={settings.keepAwakeEnabled}
          onValueChange={(value) => updateSettings({ ...settings, keepAwakeEnabled: value })}
        />
      </AppCard>
    </Screen>
  );
}

function Divider({ color }: { readonly color: string }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color }} />;
}

function SettingSwitch({ title, description, value, onValueChange }: { title: string; description: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={[styles.switchTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch accessibilityLabel={title} value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 10, paddingTop: 18 },
  pageTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 18, textAlign: "right", marginBottom: 2 },
  title: { fontFamily: "Vazirmatn_700Bold", fontSize: 15, textAlign: "right" },
  row: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap", alignItems: "center" },
  switchRow: { minHeight: 72, flexDirection: "row-reverse", gap: 12, alignItems: "center", paddingVertical: 9 },
  switchCopy: { flex: 1, gap: 2 },
  switchTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: 13, textAlign: "right" },
  description: { fontFamily: "Vazirmatn_400Regular", fontSize: 11.5, lineHeight: 19, textAlign: "right" },
});
