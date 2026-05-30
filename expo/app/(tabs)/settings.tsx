import { useTheme } from "@/contexts/ThemeContext";
import {
  AppWindow,
  ChevronRight,
  Info,
  Star,
} from "lucide-react-native";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Info Card ─────────────────────────────── */}
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

        {/* ── Settings Rows ─────────────────────────────── */}
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
});
