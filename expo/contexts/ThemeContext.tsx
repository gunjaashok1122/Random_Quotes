import createContextHook from "@nkzw/create-context-hook";
import { useColorScheme } from "react-native";

import { light, dark, type ThemeColors } from "@/constants/colors";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors: ThemeColors = isDark ? dark : light;

  return { colors, isDark };
});
