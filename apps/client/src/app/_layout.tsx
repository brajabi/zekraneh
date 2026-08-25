import "@/global.css";

import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from "@expo-google-fonts/noto-naskh-arabic";
import { Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_700Bold } from "@expo-google-fonts/vazirmatn";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { AppProvider, useApp } from "@/providers/app-provider";
import { PwaRegistration } from "@/components/pwa-registration";
import { useAppTheme } from "@/theme/theme";

void SplashScreen.preventAutoHideAsync();

function AppRuntime() {
  const { status, error, settings } = useApp();
  const { colors, mode } = useAppTheme();

  useEffect(() => {
    Uniwind.setTheme(settings.theme);
  }, [settings.theme]);

  if (status !== "ready") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {status === "loading" ? <ActivityIndicator size="large" color={colors.primary} /> : null}
        <Text style={[styles.message, { color: status === "error" ? colors.danger : colors.text }]}>
          {status === "error" ? `راه‌اندازی ذکرانه ناموفق بود\n${error ?? "خطای ناشناخته"}` : "در حال آماده‌سازی محتوای آفلاین…"}
        </Text>
      </View>
    );
  }

  return (
    <HeroUINativeProvider config={{ isRTL: true, textProps: { maxFontSizeMultiplier: 1.8 } }}>
      <Head>
        <title>ذکرانه — همراه عبادت</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="راهنمای آفلاین و مرحله‌به‌مرحله عبادت‌ها" />
        <meta name="theme-color" content={mode === "dark" ? "#0F172A" : "#182F62"} />
        <meta name="application-name" content="ذکرانه" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>
      <PwaRegistration />
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: "Vazirmatn_700Bold" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="prayer/[id]"
          options={{
            title: settings.locale === "fa" ? "جزئیات عبادت" : "تفاصيل العبادة",
            headerTitleStyle: { fontFamily: "Vazirmatn_700Bold", fontSize: 16 },
          }}
        />
        <Stack.Screen name="session" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </HeroUINativeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppProvider>
          <AppRuntime />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 18 },
  message: { fontFamily: "Vazirmatn_500Medium", fontSize: 16, textAlign: "center", lineHeight: 28 },
});
