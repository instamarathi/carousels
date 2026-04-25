import React, { useEffect, useState } from "react";
import { AuthWidget } from "./AuthWidget";
import { HomePage } from "./HomePage";
import { SeriesPage } from "./SeriesPage";
import { useAuth } from "./useAuth";
import { useProgress, activeStreakDays } from "./useProgress";
import { navigateTo, useHashRoute } from "./useHashRoute";
import { FlameIcon } from "./icons";
import type { Manifest } from "./types";

function dataUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + "/" + path;
}

export const App: React.FC = () => {
  const route = useHashRoute();
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const {
    progress,
    completedEpisodes,
    streak,
    loaded: progressLoaded,
    recordProgress,
  } = useProgress(user);

  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    fetch(dataUrl("data/manifest.json"))
      .then((r) => r.json())
      .then(setManifest)
      .catch((e) => console.error("manifest load failed", e));
  }, []);

  return (
    <div className="layout">
      <header className="topbar">
        <button
          className="topbar-home"
          onClick={() => navigateTo({ kind: "home" })}
          aria-label="Home"
        >
          Tini Tiny Stories
        </button>
        <div className="topbar-spacer" />
        {user && activeStreakDays(streak) > 0 && (
          <div
            className="topbar-streak"
            title={`${activeStreakDays(streak)} day reading streak`}
          >
            <FlameIcon />
            <strong>{activeStreakDays(streak)}</strong>
            <span className="topbar-streak-label">day streak</span>
          </div>
        )}
        <AuthWidget
          user={user}
          loading={authLoading}
          signIn={signIn}
          signOut={signOut}
          compact
        />
      </header>

      <main className="page">
        {route.kind === "home" && (
          <HomePage
            manifest={manifest}
            signedIn={!!user}
            completedEpisodes={completedEpisodes}
            streak={streak}
          />
        )}
        {route.kind === "series" && (
          <SeriesPage
            slug={route.slug}
            routeEpisode={route.episode}
            manifest={manifest}
            user={user}
            authLoading={authLoading}
            signIn={signIn}
            progress={progress}
            progressLoaded={progressLoaded}
            recordProgress={recordProgress}
          />
        )}
      </main>
    </div>
  );
};
