import { getAuthorInfo, useQuotes } from "@/contexts/QuoteContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  ChevronDown,
  Copy,
  Filter,
  Heart,
  QuoteIcon,
  RefreshCw,
  Share2,
  Sparkles,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { QuoteCategory } from "@/constants/quotes";
import { ALL_CATEGORIES } from "@/constants/quotes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Maps filter categories to compact chip labels. */
const FILTER_LABELS: Record<QuoteCategory, string> = {
  "Indian Leaders": "Leaders",
  "Indian Scientists": "Scientists",
  "Indian Entrepreneurs": "Entrepreneurs",
  "Indian Spiritual Leaders": "Spiritual",
  "Indian Sports Personalities": "Sports",
  "Global Authors": "Global",
  Motivation: "Motivation",
  Success: "Success",
  Leadership: "Leadership",
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    currentQuote,
    dailyQuote,
    activeFilter,
    nextQuote,
    setFilter,
    toggleFavorite,
    isFavorite,
  } = useQuotes();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showExplore, setShowExplore] = useState(false);

  const faved = isFavorite(currentQuote.id);
  const authorInfo = getAuthorInfo(currentQuote.author);

  // ── Animated quote transition ────────────────────────────
  const handleNextQuote = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExplore(false);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
    ]).start(() => {
      nextQuote();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => setIsRefreshing(false));
    });
  }, [isRefreshing, fadeAnim, scaleAnim, nextQuote]);

  // ── Favorite toggle ──────────────────────────────────────
  const handleFavoriteToggle = useCallback(() => {
    Haptics.impactAsync(
      faved
        ? Haptics.ImpactFeedbackStyle.Soft
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    toggleFavorite(currentQuote);
    setFavorited(true);
    setTimeout(() => setFavorited(false), 600);
  }, [faved, toggleFavorite, currentQuote]);

  // ── Copy to clipboard ────────────────────────────────────
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(
      `"${currentQuote.text}" — ${currentQuote.author}`,
    );
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [currentQuote]);

  // ── Share ─────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `"${currentQuote.text}"\n\n— ${currentQuote.author}\n\nShared via Random Quotes For You`,
      });
    } catch {
      // user cancelled
    }
  }, [currentQuote]);

  // ── Filter change handler ────────────────────────────────
  const handleFilterChange = useCallback(
    (filter: QuoteCategory | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowExplore(false);
      setFilter(filter);
    },
    [setFilter],
  );

  // ── Reset animation on quote change ──────────────────────
  useEffect(() => {
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }, [currentQuote.id, fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDark
            ? [colors.gradientStart, colors.gradientEnd]
            : [colors.gradientEnd, colors.gradientStart]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <QuoteIcon size={22} color={colors.accent} strokeWidth={2.2} />
            <Text style={[styles.brandText, { color: colors.primaryText }]}>
              Random Quotes
            </Text>
          </View>
        </View>

        {/* ── Filter Chips ─────────────────────────────────── */}
        <View style={styles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Pressable
              onPress={() => handleFilterChange(null)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: activeFilter === null
                    ? colors.accent
                    : colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {activeFilter === null ? (
                <Filter size={13} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <Filter size={13} color={colors.accent} strokeWidth={2} />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: activeFilter === null ? "#FFFFFF" : colors.secondaryText,
                  },
                ]}
              >
                All
              </Text>
            </Pressable>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = activeFilter === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleFilterChange(cat)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.accent : colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isActive ? "#FFFFFF" : colors.secondaryText,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {FILTER_LABELS[cat]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Scrollable content ────────────────────────────── */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Daily Quote Section ──────────────────────────── */}
          {dailyQuote && (
            <View style={styles.dailyContainer}>
              <View style={[styles.dailyChip, { backgroundColor: colors.chipBg }]}>
                <Sparkles size={13} color={colors.accent} />
                <Text style={[styles.dailyLabel, { color: colors.accent }]}>
                  Daily Quote
                </Text>
              </View>
              <View
                style={[
                  styles.dailyCard,
                  { backgroundColor: colors.dailyCardBg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.dailyQuoteText, { color: colors.primaryText }]}>
                  "{dailyQuote.text}"
                </Text>
                <Text style={[styles.dailyAuthorText, { color: colors.accent }]}>
                  — {dailyQuote.author}
                </Text>
              </View>
            </View>
          )}

          {/* ── Main Quote Card ──────────────────────────────── */}
          <View style={styles.cardWrapper}>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: isDark ? "#000" : "#3D2C1E",
                },
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={[styles.bigQuoteMark, { color: colors.accentLight }]}>
                "
              </Text>
              <Text style={[styles.quoteText, { color: colors.primaryText }]}>
                {currentQuote.text}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* ── Author row with avatar & profession ──────── */}
              <Pressable
                onPress={() => setShowExplore((s) => !s)}
                style={({ pressed }) => [
                  styles.authorSection,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.authorAvatar,
                    { backgroundColor: colors.accentLight },
                  ]}
                >
                  <Text style={styles.authorEmoji}>
                    {authorInfo.avatarEmoji}
                  </Text>
                </View>
                <View style={styles.authorTextGroup}>
                  <Text style={[styles.authorName, { color: colors.accent }]}>
                    {currentQuote.author}
                  </Text>
                  {authorInfo.profession ? (
                    <Text
                      style={[styles.authorProfession, { color: colors.secondaryText }]}
                      numberOfLines={1}
                    >
                      {authorInfo.profession}
                    </Text>
                  ) : null}
                </View>
                <ChevronDown
                  size={16}
                  color={colors.secondaryText}
                  strokeWidth={2}
                  style={{
                    transform: [{ rotate: showExplore ? "180deg" : "0deg" }],
                  }}
                />
              </Pressable>

              {/* ── Explore Author ────────────────────────────── */}
              {showExplore && authorInfo.bio ? (
                <View
                  style={[
                    styles.exploreSection,
                    { backgroundColor: colors.chipBg, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.exploreHeader}>
                    <Text
                      style={[styles.exploreLabel, { color: colors.accent }]}
                    >
                      About {currentQuote.author}
                    </Text>
                    <Pressable
                      onPress={() => setShowExplore(false)}
                      hitSlop={8}
                    >
                      <X size={14} color={colors.secondaryText} strokeWidth={2} />
                    </Pressable>
                  </View>
                  <Text
                    style={[
                      styles.exploreBio,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {authorInfo.bio}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </View>

          {/* ── Action Buttons ───────────────────────────────── */}
          <View style={styles.actionRow}>
          <Pressable
            onPress={handleFavoriteToggle}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [
                  { scale: favorited ? 1.25 : pressed ? 0.92 : 1 },
                ],
              },
            ]}
          >
            <Heart
              size={20}
              color={faved ? "#E05555" : colors.accent}
              fill={faved ? "#E05555" : "transparent"}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            {copied ? (
              <Text style={[styles.copiedText, { color: colors.success }]}>
                Copied!
              </Text>
            ) : (
              <Copy size={20} color={colors.accent} strokeWidth={2} />
            )}
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <Share2 size={20} color={colors.accent} strokeWidth={2} />
          </Pressable>
        </View>

          {/* ── New Quote Button ─────────────────────────────── */}
          <Pressable
            onPress={handleNextQuote}
            disabled={isRefreshing}
            style={({ pressed }) => [
              styles.newQuoteBtn,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                opacity: isRefreshing ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <RefreshCw
              size={20}
              color="#FFFFFF"
              strokeWidth={2.5}
            />
            <Text style={styles.newQuoteText}>New Quote</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // ── Filters ──────────────────────────────────────────────
  filterWrap: {
    marginTop: 12,
    marginBottom: 4,
  },
  filterScroll: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 24,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  // ── Daily Quote ──────────────────────────────────────────
  dailyContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  dailyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  dailyLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dailyCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    width: SCREEN_WIDTH - 72,
    alignItems: "center",
  },
  dailyQuoteText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  dailyAuthorText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  // ── Main Card ────────────────────────────────────────────
  cardWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    minHeight: 320,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 28,
    borderWidth: 1,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  bigQuoteMark: {
    fontSize: 72,
    lineHeight: 60,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    alignSelf: "flex-start",
    marginBottom: -8,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  divider: {
    height: 1,
    width: 40,
    marginVertical: 18,
    opacity: 0.5,
  },

  // ── Author Section ───────────────────────────────────────
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    width: "100%",
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  authorEmoji: {
    fontSize: 24,
  },
  authorTextGroup: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  authorProfession: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  // ── Explore Author ───────────────────────────────────────
  exploreSection: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    width: "100%",
    gap: 8,
  },
  exploreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exploreLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  exploreBio: {
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Action Row ───────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  copiedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  newQuoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: Platform.OS === "ios" ? 12 : 24,
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  newQuoteText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
