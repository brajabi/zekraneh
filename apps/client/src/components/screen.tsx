import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { useAppTheme } from "@/theme/theme";

interface ScreenProps extends PropsWithChildren {
  readonly scroll?: boolean;
  readonly contentStyle?: ScrollViewProps["contentContainerStyle"];
}

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const { colors } = useAppTheme();
  if (!scroll) return <View style={[styles.root, { backgroundColor: colors.background }, contentStyle]}>{children}</View>;
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: "100%", maxWidth: 960, alignSelf: "center", padding: 14, paddingBottom: 28 },
});
