import Svg, { Circle, Path } from "react-native-svg";
import { useAppTheme } from "@/theme/theme";

export function BrandMark({ size = 38 }: { readonly size?: number }) {
  const { colors } = useAppTheme();
  return (
    <Svg accessibilityLabel="نشان ذکرانه" role="img" width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="29" fill={colors.primaryStrong} />
      <Path d="M37 13c-5 4-8 10-8 17 0 11 9 20 20 20h2A24 24 0 1 1 37 13Z" fill={colors.accent} />
      <Circle cx="49" cy="15" r="2.2" fill={colors.accent} />
    </Svg>
  );
}
