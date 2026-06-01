import { Tabs } from "expo-router";
import { Heart, Home, Settings, Quote as QuoteIcon } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const color = isFocused
            ? colors.tabIconSelected
            : colors.tabIconDefault;

          let Icon = Home;
          if (route.name === "favorites") Icon = Heart;
          if (route.name === "settings") Icon = Settings;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.bottomTabButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <Icon color={color} size={24} strokeWidth={2} />
              <Text style={[styles.bottomTabLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Tablet & Desktop top header style
  return (
    <View
      style={[
        styles.topTabBar,
        {
          backgroundColor: colors.tabBar,
          borderBottomColor: colors.tabBarBorder,
        },
      ]}
    >
      <View style={styles.topTabBarContainer}>
        <View style={styles.brandRow}>
          <View
            style={[styles.logoIconBox, { backgroundColor: colors.accentLight }]}
          >
            <QuoteIcon size={16} color={colors.accent} strokeWidth={2.5} />
          </View>
          <Text style={[styles.brandText, { color: colors.primaryText }]}>
            Random Quotes
          </Text>
        </View>

        <View style={styles.topTabsList}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label =
              options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const color = isFocused ? colors.accent : colors.tabIconDefault;

            let Icon = Home;
            if (route.name === "favorites") Icon = Heart;
            if (route.name === "settings") Icon = Settings;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[
                  styles.topTabButton,
                  isFocused && { borderBottomColor: colors.accent },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <Icon color={color} size={18} strokeWidth={2} />
                <Text
                  style={[
                    styles.topTabLabel,
                    {
                      color,
                      fontWeight: isFocused ? "700" : "500",
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    height: 88,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    elevation: 0,
  },
  bottomTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  topTabBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    borderBottomWidth: 1,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    }),
  },
  topTabBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  topTabsList: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 8,
  },
  topTabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: "100%",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  topTabLabel: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
});
