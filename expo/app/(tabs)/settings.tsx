import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useQuotes } from "@/contexts/QuoteContext";
import {
  AppWindow,
  ChevronRight,
  Info,
  LogOut,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({
  icon,
  label,
  detail,
  onPress,
  isLast = false,
}: SettingRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
        isLast && styles.rowLast,
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
          {icon}
        </View>
        <Text style={[styles.rowLabel, { color: colors.primaryText }]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {detail ? (
          <Text style={[styles.rowDetail, { color: colors.secondaryText }]}>
            {detail}
          </Text>
        ) : null}
        <ChevronRight size={18} color={colors.secondaryText} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { username, logout, updateUsername } = useQuotes();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(username || "");

  React.useEffect(() => {
    if (username) {
      setNewName(username);
    }
  }, [username]);

  const handleRateApp = () => {
    // Open app store - in production, use the actual app store link
    Linking.openURL(
      Platform.OS === "ios"
        ? "https://apps.apple.com/app/id0000000000"
        : "https://play.google.com/store/apps/details?id=com.randomquotes",
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !isMobile && {
            flexDirection: "row",
            maxWidth: 900,
            width: "100%",
            alignSelf: "center",
            gap: 32,
            paddingTop: 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Left Column: Profile Card & App Info Card ─────────────────────────────── */}
        <View style={[{ gap: 20 }, !isMobile && { width: 320 }]}>
          {/* User Profile Card */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={[styles.avatarBox, { backgroundColor: colors.accentLight }]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <Text style={[styles.welcomeText, { color: colors.primaryText }]}>
              Welcome,
            </Text>
            
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={[
                    styles.editNameInput,
                    {
                      color: colors.primaryText,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.secondaryText}
                  autoFocus
                />
                <View style={styles.editNameButtons}>
                  <Pressable
                    onPress={async () => {
                      if (newName.trim()) {
                        await updateUsername(newName.trim());
                        setIsEditingName(false);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.editButton,
                      { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
                    ]}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setNewName(username || "");
                      setIsEditingName(false);
                    }}
                    style={({ pressed }) => [
                      styles.editButton,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: colors.border,
                        opacity: pressed ? 0.9 : 1
                      }
                    ]}
                  >
                    <Text style={[styles.editButtonText, { color: colors.primaryText }]}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={[styles.usernameText, { color: colors.accent }]} numberOfLines={1}>
                  {username || "Guest"}
                </Text>
                {username && (
                  <Pressable
                    onPress={() => {
                      setNewName(username);
                      setIsEditingName(true);
                    }}
                    style={styles.editLink}
                  >
                    <Text style={[styles.editLinkText, { color: colors.secondaryText }]}>Edit Name</Text>
                  </Pressable>
                )}
              </>
            )}
            
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.logoutBtn,
                { borderColor: colors.danger, opacity: pressed ? 0.8 : 1, marginTop: isEditingName ? 16 : 4 }
              ]}
            >
              <LogOut size={16} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
            </Pressable>
          </View>

          {/* App Info Card */}
          <View
            style={[
              styles.appCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View
              style={[
                styles.appIconPlaceholder,
                { backgroundColor: colors.accent },
              ]}
            >
              <AppWindow size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={[styles.appName, { color: colors.primaryText }]}>
              Random Quotes For You
            </Text>
            <Text style={[styles.appVersion, { color: colors.secondaryText }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        {/* ── Right Column: Settings Rows ─────────────────────────────── */}
        <View style={[{ gap: 24 }, !isMobile && { flex: 1 }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              About
            </Text>
            <View
              style={[
                styles.sectionContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <SettingRow
                icon={<Info size={18} color={colors.accent} strokeWidth={2} />}
                label="About the App"
                onPress={() => {}}
              />
              <SettingRow
                icon={<Star size={18} color={colors.accent} strokeWidth={2} />}
                label="Rate the App"
                onPress={handleRateApp}
                isLast
              />
            </View>
          </View>

          <Text style={[styles.footer, { color: colors.secondaryText }]}>
            Built with love for inspiration seekers.
            {"\n"}120+ hand-picked quotes to brighten your day.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 24,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    width: "100%",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  appCard: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  appIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    paddingLeft: 4,
  },
  sectionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowDetail: {
    fontSize: 14,
  },
  footer: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    paddingTop: 8,
  },
  editNameContainer: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  editNameInput: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: "center",
  },
  editNameButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editLink: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  editLinkText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
