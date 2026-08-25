import { Tabs } from "expo-router";
import { useWindowDimensions, type ColorValue } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useApp } from "@/providers/app-provider";
import { useAppTheme } from "@/theme/theme";

type TabIconName = "worship" | "mine" | "settings";

function TabIcon({ name, color }: { readonly name: TabIconName; readonly color: ColorValue }) {
  if (name === "worship") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M15.7 3.4A8.7 8.7 0 1 0 20.6 17 7.6 7.6 0 0 1 15.7 3.4Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="m18.2 4.2.5 1.1 1.2.2-1 .8.2 1.2-1.1-.6-1.1.6.2-1.2-1-.8 1.2-.2.5-1.1Z" fill={color} />
      </Svg>
    );
  }
  if (name === "mine") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M6 4.5h12v16l-6-3.6-6 3.6v-16Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M9 9h6M9 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      <Path d="M12 2.8v2M12 19.2v2M21.2 12h-2M4.8 12h-2M18.5 5.5 17.1 7M6.9 17 5.5 18.5M18.5 18.5 17 17.1M7 6.9 5.5 5.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { settings } = useApp();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const fa = settings.locale === "fa";
  const tabContentHeight = Math.ceil(64 + Math.max(0, fontScale - 1) * 20);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        initialRouteName="index"
        backBehavior="initialRoute"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelPosition: "below-icon",
          tabBarLabelStyle: { fontFamily: "Vazirmatn_500Medium", fontSize: 11, lineHeight: 18 },
          tabBarIconStyle: { marginTop: 1 },
          tabBarItemStyle: { minHeight: tabContentHeight - 10 },
          tabBarStyle: {
            height: tabContentHeight + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom + 6,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: fa ? "عبادت‌ها" : "العبادات",
          tabBarAccessibilityLabel: fa ? "تب عبادت‌ها" : "تب العبادات",
          tabBarIcon: ({ color }) => <TabIcon name="worship" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: fa ? "عبادت‌های من" : "عباداتي",
          tabBarAccessibilityLabel: fa ? "تب عبادت‌های من" : "تب عباداتي",
          tabBarIcon: ({ color }) => <TabIcon name="mine" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: fa ? "تنظیمات" : "الإعدادات",
          tabBarAccessibilityLabel: fa ? "تب تنظیمات" : "تب الإعدادات",
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
      </Tabs>
    </SafeAreaView>
  );
}
