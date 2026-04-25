import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export type Position = {
  episode: number;
  slide: number;
};

export type ProgressMap = Record<string, Position>;
export type CompletedEpisodesMap = Record<string, number[]>;

export type Streak = {
  current: number;
  longest: number;
  last_read_date: string | null;
};

const DEBOUNCE_MS = 1500;

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = new Date(fy, fm - 1, fd).getTime();
  const b = new Date(ty, tm - 1, td).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const EMPTY_STREAK: Streak = { current: 0, longest: 0, last_read_date: null };

export function useProgress(user: User | null) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [completedEpisodes, setCompletedEpisodes] = useState<CompletedEpisodesMap>({});
  const [streak, setStreak] = useState<Streak>(EMPTY_STREAK);
  const [loaded, setLoaded] = useState(false);

  const progressRef = useRef<ProgressMap>({});
  const completedRef = useRef<CompletedEpisodesMap>({});
  const streakRef = useRef<Streak>(EMPTY_STREAK);

  const pendingProgressRef = useRef<ProgressMap>({});
  const pendingCompletedRef = useRef<Set<string>>(new Set());
  const streakDirtyRef = useRef(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { completedRef.current = completedEpisodes; }, [completedEpisodes]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  useEffect(() => {
    if (!user) {
      setProgress({});
      setCompletedEpisodes({});
      setStreak(EMPTY_STREAK);
      progressRef.current = {};
      completedRef.current = {};
      streakRef.current = EMPTY_STREAK;
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.data() ?? {};
        const p = (data.progress ?? {}) as ProgressMap;
        const ce = (data.completed_episodes ?? {}) as CompletedEpisodesMap;
        const st = (data.streak ?? EMPTY_STREAK) as Streak;
        setProgress(p);
        setCompletedEpisodes(ce);
        setStreak(st);
        progressRef.current = p;
        completedRef.current = ce;
        streakRef.current = st;
      })
      .catch((e) => {
        console.error("progress load failed", e);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const flushPending = useCallback(async (uid: string, email: string | null, displayName: string | null) => {
    const pendingProgress = pendingProgressRef.current;
    const pendingCompleted = pendingCompletedRef.current;
    const streakDirty = streakDirtyRef.current;
    pendingProgressRef.current = {};
    pendingCompletedRef.current = new Set();
    streakDirtyRef.current = false;

    if (
      Object.keys(pendingProgress).length === 0 &&
      pendingCompleted.size === 0 &&
      !streakDirty
    ) return;

    const update: Record<string, unknown> = {
      email,
      display_name: displayName,
      last_seen: serverTimestamp(),
    };
    if (Object.keys(pendingProgress).length > 0) {
      const progressUpdate: Record<string, unknown> = {};
      for (const [slug, pos] of Object.entries(pendingProgress)) {
        progressUpdate[slug] = { ...pos, updated_at: serverTimestamp() };
      }
      update.progress = progressUpdate;
    }
    if (pendingCompleted.size > 0) {
      const completedUpdate: Record<string, number[]> = {};
      for (const slug of pendingCompleted) {
        completedUpdate[slug] = completedRef.current[slug] ?? [];
      }
      update.completed_episodes = completedUpdate;
    }
    if (streakDirty) {
      update.streak = streakRef.current;
    }

    try {
      await setDoc(doc(db, "users", uid), update, { merge: true });
    } catch (e) {
      console.error("progress save failed", e);
    }
  }, []);

  const recordProgress = useCallback(
    (seriesSlug: string, episode: number, slide: number, slidesInEpisode: number) => {
      if (!user) return;

      const existing = progressRef.current[seriesSlug];
      const positionChanged = !(existing && existing.episode === episode && existing.slide === slide);
      if (positionChanged) {
        const next: Position = { episode, slide };
        progressRef.current = { ...progressRef.current, [seriesSlug]: next };
        setProgress(progressRef.current);
        pendingProgressRef.current[seriesSlug] = next;
      }

      const isLastSlide = slidesInEpisode > 0 && slide === slidesInEpisode - 1;
      if (isLastSlide) {
        const list = completedRef.current[seriesSlug] ?? [];
        if (!list.includes(episode)) {
          const nextList = [...list, episode].sort((a, b) => a - b);
          completedRef.current = { ...completedRef.current, [seriesSlug]: nextList };
          setCompletedEpisodes(completedRef.current);
          pendingCompletedRef.current.add(seriesSlug);

          const today = localDateKey();
          const last = streakRef.current.last_read_date;
          if (last !== today) {
            const continued = !!last && daysBetween(last, today) === 1;
            const current = continued ? streakRef.current.current + 1 : 1;
            const longest = Math.max(streakRef.current.longest, current);
            const next: Streak = { current, longest, last_read_date: today };
            streakRef.current = next;
            setStreak(next);
            streakDirtyRef.current = true;
          }
        }
      }

      const dirty =
        positionChanged ||
        pendingCompletedRef.current.size > 0 ||
        streakDirtyRef.current;
      if (dirty) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          flushPending(user.uid, user.email, user.displayName);
        }, DEBOUNCE_MS);
      }
    },
    [user, flushPending],
  );

  useEffect(() => {
    if (!user) return;
    const onHide = () => {
      const hasPending =
        Object.keys(pendingProgressRef.current).length > 0 ||
        pendingCompletedRef.current.size > 0 ||
        streakDirtyRef.current;
      if (hasPending) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        flushPending(user.uid, user.email, user.displayName);
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [user, flushPending]);

  return { progress, completedEpisodes, streak, loaded, recordProgress };
}

export function activeStreakDays(streak: Streak, today = localDateKey()): number {
  if (!streak.last_read_date) return 0;
  const gap = daysBetween(streak.last_read_date, today);
  if (gap <= 1) return streak.current;
  return 0;
}
