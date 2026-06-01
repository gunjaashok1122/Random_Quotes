import { getAuthorInfo, useQuotes } from "@/contexts/QuoteContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Copy, Heart, QuoteIcon, Share2, Trash2 } from "lucide-react-native";
import { useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Quote } from "@/constants/quotes";

function EmptyFavorites({
  colors,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={emptyStyles.container}>
      <Heart size={56} color={colors.accentLight} strokeWidth={1.5} />
      <Text style={[emptyStyles.title, { color: colors.primaryText }]}>
        No favorites yet
      </Text>
      <Text style={[emptyStyles.subtitle, { color: colors.secondaryText }]}>
        Tap the heart icon on any quote to save it here.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useQuotes();
  const { isMobile, isTablet, width } = useResponsive();
  const containerWidth = isMobile ? width : Math.min(width, 1200);

  const numColumns = isMobile ? 1 : isTablet ? 2 : 3;

  const handleCopy = useCallback(async (quote: Quote) => {
    await Clipboard.setStringAsync(`"${quote.text}" — ${quote.author}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleShare = useCallback(async (quote: Quote) => {
    try {
      await Share.share(
        {
          message: `"${quote.text}"\n\n— ${quote.author}\n\nShared via Random Quotes For You`,
        },
        { dialogTitle: "Share this quote" },
      );
    } catch {
      // user cancelled
    }
  }, []);

  const handleRemove = useCallback(
    (quote: Quote) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite(quote);
    },
    [toggleFavorite],
  );

  const renderItem = useCallback(
    ({ item }: { item: Quote }) => {
      const authorInfo = getAuthorInfo(item.author);
      const cardWidthPercent = isMobile ? "100%" : `${100 / numColumns}%`;

      return (
        <View
          style={[
            styles.quoteCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            !isMobile && {
              flex: 1,
              maxWidth: (containerWidth - 32) / numColumns - 16,
              margin: 8,
            },
          ]}
        >
          <View style={styles.quoteHeader}>
            <QuoteIcon size={16} color={colors.accent} strokeWidth={2} />
          </View>
          <Text style={[styles.quoteText, { color: colors.primaryText }]}>
            "{item.text}"
          </Text>

          {/* ── Author row with avatar & profession ────────── */}
          <View style={styles.authorRow}>
            <View
              style={[
                styles.authorAvatar,
                { backgroundColor: colors.accentLight },
              ]}
            >
              <Text style={styles.authorEmoji}>{authorInfo.avatarEmoji}</Text>
            </View>
            <View style={styles.authorTextGroup}>
              <Text style={[styles.authorName, { color: colors.accent }]}>
                {item.author}
              </Text>
              {authorInfo.profession ? (
                <Text
                  style={[
                    styles.authorProfession,
                    { color: colors.secondaryText },
                  ]}
                  numberOfLines={1}
                >
                  {authorInfo.profession}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => handleCopy(item)}
              style={({ pressed }) => [
                styles.iconBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={8}
            >
              <Copy size={18} color={colors.secondaryText} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => handleShare(item)}
              style={({ pressed }) => [
                styles.iconBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={8}
            >
              <Share2 size={18} color={colors.secondaryText} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => handleRemove(item)}
              style={({ pressed }) => [
                styles.iconBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={8}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      );
    },
    [colors, handleCopy, handleShare, handleRemove, isMobile, numColumns, containerWidth],
  );

  if (favorites.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View style={[{ flex: 1 }, !isMobile && { paddingTop: 90 }]}>
          <EmptyFavorites colors={colors} />
        </View>
      </SafeAreaView>
    );
  }

  const listContainerStyle: StyleProp<ViewStyle> = [
    styles.list,
    !isMobile && {
      maxWidth: 1200,
      width: "100%",
      alignSelf: "center",
      paddingTop: 90,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        key={`favorites-list-${numColumns}`}
        data={favorites}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={listContainerStyle}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  quoteCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 14,
  },

  // ── Author row ───────────────────────────────────────────
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  authorEmoji: {
    fontSize: 18,
  },
  authorTextGroup: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
  },
  authorProfession: {
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Actions ──────────────────────────────────────────────
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  iconBtn: {
    padding: 10,
  },
});
