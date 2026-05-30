import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AuthorInfo, Quote, QuoteCategory } from "@/constants/quotes";
import { ALL_CATEGORIES, authorRegistry, quotes } from "@/constants/quotes";

const FAVORITES_KEY = "quote-favorites-v1";
const DAILY_KEY = "quote-daily-v1";
const DAILY_DATE_KEY = "quote-daily-date-v1";
const FILTER_KEY = "quote-filter-v1";
const RECENT_AUTHORS_LIMIT = 8;

// ── Helpers ────────────────────────────────────────────────

/** Look up author info from registry, or return a sensible default. */
export function getAuthorInfo(author: string): AuthorInfo {
  return (
    authorRegistry[author] ?? {
      name: author,
      profession: "",
      nationality: "International",
      category: "Motivation",
      bio: "",
      avatarEmoji: "📝",
    }
  );
}

/** Returns a daily quote based on the current date string. */
function getDailyQuote(dateStr: string, pool: Quote[]): Quote {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Pick a random quote from `pool`, avoiding `excludeId` and any author
 * in `recentAuthors`. Returns the first available if all are excluded.
 */
function pickRandomQuote(
  pool: Quote[],
  excludeId?: number,
  recentAuthors?: string[],
): Quote {
  const excludedAuthors = new Set(recentAuthors ?? []);
  let candidates = pool;

  // Exclude by id
  if (excludeId != null) {
    candidates = candidates.filter((q) => q.id !== excludeId);
  }

  // Try to exclude recent authors first
  const fresh = candidates.filter((q) => !excludedAuthors.has(q.author));
  if (fresh.length > 0) {
    candidates = fresh;
  }

  if (candidates.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Fair rotation: if current quote is Indian, next has ~60% chance of
 * being International, and vice versa.
 */
function pickWithRotation(
  pool: Quote[],
  currentNationality: string,
  excludeId?: number,
  recentAuthors?: string[],
): Quote {
  const excludedAuthors = new Set(recentAuthors ?? []);

  // Decide target nationality
  const flip = Math.random();
  let target: "Indian" | "International";
  if (currentNationality === "Indian") {
    target = flip < 0.6 ? "International" : "Indian";
  } else {
    target = flip < 0.6 ? "Indian" : "International";
  }

  let candidates = pool.filter((q) => q.nationality === target);
  if (excludeId != null) {
    candidates = candidates.filter((q) => q.id !== excludeId);
  }
  // Fall back to all if no candidates match the target
  if (candidates.length === 0) {
    candidates = pool;
    if (excludeId != null) {
      candidates = candidates.filter((q) => q.id !== excludeId);
    }
  }

  const fresh = candidates.filter((q) => !excludedAuthors.has(q.author));
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Context Hook ───────────────────────────────────────────

export const [QuoteProvider, useQuotes] = createContextHook(() => {
  const [currentQuote, setCurrentQuote] = useState<Quote>(() =>
    pickRandomQuote(quotes),
  );
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QuoteCategory | null>(null);

  const recentAuthorsRef = useRef<string[]>([]);

  /** Push author to recent list, cap at limit. */
  const trackAuthor = useCallback((author: string) => {
    recentAuthorsRef.current = [
      author,
      ...recentAuthorsRef.current.filter((a) => a !== author),
    ].slice(0, RECENT_AUTHORS_LIMIT);
  }, []);

  // ── Load persisted data ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [favJson, dailyJson, dailyDate, savedFilter] =
          await Promise.all([
            AsyncStorage.getItem(FAVORITES_KEY),
            AsyncStorage.getItem(DAILY_KEY),
            AsyncStorage.getItem(DAILY_DATE_KEY),
            AsyncStorage.getItem(FILTER_KEY),
          ]);

        if (favJson) {
          const parsed: Quote[] = JSON.parse(favJson);
          setFavorites(parsed);
        }

        if (savedFilter) {
          setActiveFilter(savedFilter as QuoteCategory);
        }

        const today = new Date().toISOString().split("T")[0];
        if (dailyDate === today && dailyJson) {
          setDailyQuote(JSON.parse(dailyJson));
        } else {
          const newDaily = getDailyQuote(today, quotes);
          setDailyQuote(newDaily);
          await AsyncStorage.multiSet([
            [DAILY_KEY, JSON.stringify(newDaily)],
            [DAILY_DATE_KEY, today],
          ]);
        }
      } catch {
        setDailyQuote(
          getDailyQuote(new Date().toISOString().split("T")[0], quotes),
        );
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // ── Persist favorites ────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(
      () => {},
    );
  }, [favorites, isLoaded]);

  // ── Get filtered pool ────────────────────────────────────
  const getFilteredPool = useCallback(
    (filter: QuoteCategory | null): Quote[] => {
      if (!filter) return quotes;
      return quotes.filter((q) => q.category === filter);
    },
    [],
  );

  // ── Actions ──────────────────────────────────────────────
  const nextQuote = useCallback(() => {
    setCurrentQuote((prev) => {
      const pool = getFilteredPool(activeFilter);
      const next = pickWithRotation(
        pool,
        prev.nationality,
        prev.id,
        recentAuthorsRef.current,
      );
      trackAuthor(next.author);
      return next;
    });
  }, [activeFilter, getFilteredPool, trackAuthor]);

  /** Set filter category and regenerate a matching quote. */
  const setFilter = useCallback(
    (filter: QuoteCategory | null) => {
      setActiveFilter(filter);
      AsyncStorage.setItem(FILTER_KEY, filter ?? "").catch(() => {});

      const pool = filter ? quotes.filter((q) => q.category === filter) : quotes;
      const next = pickRandomQuote(pool);
      setCurrentQuote(next);
      trackAuthor(next.author);
    },
    [trackAuthor],
  );

  const toggleFavorite = useCallback((quote: Quote) => {
    setFavorites((prev) => {
      const exists = prev.some((q) => q.id === quote.id);
      if (exists) return prev.filter((q) => q.id !== quote.id);
      return [...prev, quote];
    });
  }, []);

  const isFavorite = useCallback(
    (quoteId: number) => favorites.some((q) => q.id === quoteId),
    [favorites],
  );

  const removeFavorite = useCallback((quoteId: number) => {
    setFavorites((prev) => prev.filter((q) => q.id !== quoteId));
  }, []);

  return {
    currentQuote,
    dailyQuote,
    favorites,
    isLoaded,
    activeFilter,
    nextQuote,
    setFilter,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    getAuthorInfo,
  };
});
