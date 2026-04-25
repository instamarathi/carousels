import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export type Position = {
  episode: number;
  slide: number;
};

export type ProgressMap = Record<string, Position>;

const DEBOUNCE_MS = 1500;

export function useProgress(user: User | null) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  const progressRef = useRef<ProgressMap>({});
  const pendingRef = useRef<ProgressMap>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!user) {
      setProgress({});
      progressRef.current = {};
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (cancelled) return;
        const p = (snap.data()?.progress ?? {}) as ProgressMap;
        setProgress(p);
        progressRef.current = p;
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
    const pending = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(pending).length === 0) return;

    // serverTimestamp() works inside nested map fields with merge:true.
    const update: Record<string, unknown> = {
      email,
      display_name: displayName,
      last_seen: serverTimestamp(),
      progress: {} as Record<string, unknown>,
    };
    const progressUpdate = update.progress as Record<string, unknown>;
    for (const [slug, pos] of Object.entries(pending)) {
      progressUpdate[slug] = { ...pos, updated_at: serverTimestamp() };
    }

    try {
      await setDoc(doc(db, "users", uid), update, { merge: true });
    } catch (e) {
      console.error("progress save failed", e);
    }
  }, []);

  const recordProgress = useCallback(
    (seriesSlug: string, episode: number, slide: number) => {
      if (!user) return;
      const existing = progressRef.current[seriesSlug];
      if (existing && existing.episode === episode && existing.slide === slide) return;

      const next: Position = { episode, slide };
      const merged = { ...progressRef.current, [seriesSlug]: next };
      progressRef.current = merged;
      setProgress(merged);

      pendingRef.current[seriesSlug] = next;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        flushPending(user.uid, user.email, user.displayName);
      }, DEBOUNCE_MS);
    },
    [user, flushPending],
  );

  // Flush pending writes if the user navigates away.
  useEffect(() => {
    if (!user) return;
    const onHide = () => {
      if (Object.keys(pendingRef.current).length > 0) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        flushPending(user.uid, user.email, user.displayName);
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [user, flushPending]);

  return { progress, loaded, recordProgress };
}
