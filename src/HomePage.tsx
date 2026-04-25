import React from "react";
import { navigateTo } from "./useHashRoute";
import { LockIcon } from "./icons";
import type { Manifest } from "./types";

export const HomePage: React.FC<{
  manifest: Manifest | null;
  signedIn: boolean;
}> = ({ manifest, signedIn }) => {
  if (!manifest) return <div className="empty-state">Loading manifest…</div>;

  const totalSeries = manifest.channels.reduce((acc, c) => acc + c.series.length, 0);
  const totalEpisodes = manifest.channels.reduce(
    (acc, c) => acc + c.series.reduce((s, x) => s + x.episode_count, 0),
    0,
  );

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1 className="home-title">Tini Tiny Stories</h1>
        <p className="home-blurb">
          Bite-sized carousels across history, business, careers, and the unwritten rules.
          Read the free preview — sign in to unlock the full catalog and resume where you left off.
        </p>
        <div className="home-stats">
          <span><strong>{totalSeries}</strong> series</span>
          <span className="dot">·</span>
          <span><strong>{totalEpisodes}</strong> episodes</span>
        </div>
      </section>

      {manifest.channels.map((channel) => (
        <section key={channel.slug} className="home-channel">
          <h2 className="home-channel-title">{channel.name}</h2>
          <div className="home-grid">
            {channel.series.map((s) => {
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
                        {channel.name}
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
                    <p className="card-tagline">{s.tagline}</p>
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
          </div>
        </section>
      ))}
    </div>
  );
};
