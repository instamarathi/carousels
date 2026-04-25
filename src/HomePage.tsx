import React, { useState } from "react";
import { navigateTo } from "./useHashRoute";
import { LockIcon } from "./icons";
import type { Manifest } from "./types";
import { activeStreakDays } from "./useProgress";
import type { CompletedEpisodesMap, Streak } from "./useProgress";

const VISIBLE_PER_CATEGORY = 5;

export const HomePage: React.FC<{
  manifest: Manifest | null;
  signedIn: boolean;
  completedEpisodes: CompletedEpisodesMap;
  streak: Streak;
}> = ({ manifest, signedIn, completedEpisodes, streak }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!manifest) return <div className="empty-state">Loading manifest…</div>;

  const totalSeries = manifest.categories.reduce((acc, c) => acc + c.series.length, 0);
  const totalEpisodes = manifest.categories.reduce(
    (acc, c) => acc + c.series.reduce((s, x) => s + x.episode_count, 0),
    0,
  );

  let episodesRead = 0;
  let seriesCompleted = 0;
  for (const category of manifest.categories) {
    for (const s of category.series) {
      const completed = completedEpisodes[s.slug] ?? [];
      episodesRead += completed.length;
      if (completed.length >= s.episode_count && s.episode_count > 0) {
        seriesCompleted += 1;
      }
    }
  }
  const streakDays = activeStreakDays(streak);

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1 className="home-title">Tini Tiny Stories</h1>
        <p className="home-blurb">
          Bite-sized carousels across history, business, careers, and the unwritten rules.
          Read the free preview — sign in to unlock the full catalog and resume where you left off.
        </p>
        {signedIn ? (
          <div className="home-stats personal">
            <span className="stat-pill streak">
              <strong>{streakDays}</strong> day streak
            </span>
            <span className="stat-pill">
              <strong>{episodesRead}</strong> episode{episodesRead === 1 ? "" : "s"} read
            </span>
            <span className="stat-pill">
              <strong>{seriesCompleted}</strong> / {totalSeries} series done
            </span>
          </div>
        ) : (
          <div className="home-stats">
            <span><strong>{totalSeries}</strong> series</span>
            <span className="dot">·</span>
            <span><strong>{totalEpisodes}</strong> episodes</span>
          </div>
        )}
      </section>

      {manifest.categories.map((category) => {
        const isExpanded = expanded.has(category.slug);
        const showAll = isExpanded || category.series.length <= VISIBLE_PER_CATEGORY;
        const visible = showAll
          ? category.series
          : category.series.slice(0, VISIBLE_PER_CATEGORY);
        const remaining = category.series.length - VISIBLE_PER_CATEGORY;

        return (
        <section key={category.slug} className="home-channel">
          <h2 className="home-channel-title">
            {category.name}
            <span className="home-channel-count">{category.series.length}</span>
          </h2>
          <div className="home-grid">
            {visible.map((s) => {
              const locked = s.requires_auth && !signedIn;
              return (
                <button
                  key={s.slug}
                  className={"series-card" + (locked ? " locked" : "")}
                  onClick={() => navigateTo({ kind: "series", slug: s.slug })}
                  style={{
                    background: `linear-gradient(165deg, ${s.colors.bg_dark} 0%, ${s.colors.bg_mid} 65%, ${s.colors.bg_dark} 100%)`,
                    borderColor: `${s.colors.accent}33`,
                  }}
                >
                  <div className="card-glow" style={{ background: `radial-gradient(circle at top right, ${s.colors.accent}22 0%, transparent 60%)` }} />
                  <div className="card-content">
                    <div className="card-top">
                      <span className="card-channel" style={{ color: s.colors.accent }}>
                        {category.name}
                      </span>
                      {locked ? (
                        <span className="card-lock">
                          <LockIcon /> Locked
                        </span>
                      ) : (
                        <span className="card-unlock" style={{ color: s.colors.accent }}>
                          Free preview
                        </span>
                      )}
                    </div>
                    <h3 className="card-title">{s.name}</h3>
                    {s.tagline && <p className="card-tagline">{s.tagline}</p>}
                    {s.concept && <p className="card-concept">{s.concept}</p>}
                    <div className="card-bottom">
                      <span className="card-episodes">
                        {s.episode_count} episode{s.episode_count === 1 ? "" : "s"}
                      </span>
                      <span className="card-arrow" style={{ color: s.colors.accent }}>→</span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!showAll && (
              <button
                className="more-card"
                onClick={() =>
                  setExpanded((prev) => new Set(prev).add(category.slug))
                }
                aria-label={`Show ${remaining} more series in ${category.name}`}
              >
                <span className="more-count">+{remaining}</span>
                <span className="more-label">more series</span>
                <span className="more-arrow">↓</span>
              </button>
            )}
            {isExpanded && category.series.length > VISIBLE_PER_CATEGORY && (
              <button
                className="more-card collapse"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    next.delete(category.slug);
                    return next;
                  })
                }
                aria-label={`Collapse ${category.name}`}
              >
                <span className="more-label">Show fewer</span>
                <span className="more-arrow">↑</span>
              </button>
            )}
          </div>
        </section>
      );
      })}
    </div>
  );
};
