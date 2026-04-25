import React, { useEffect, useMemo, useState } from "react";
import { Carousel } from "./Carousel";
import { Slide } from "./Slide";
import { useAuth } from "./useAuth";
import { useProgress } from "./useProgress";
import type { Channel, Episode, Manifest, SeriesData, SeriesEntry } from "./types";

function dataUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + "/" + path;
}

export const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { progress, loaded: progressLoaded, recordProgress } = useProgress(user);

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [active, setActive] = useState<{ channel: Channel; series: SeriesEntry } | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null);
  const [initialSlide, setInitialSlide] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch(dataUrl("data/manifest.json"))
      .then((r) => r.json())
      .then((m: Manifest) => {
        setManifest(m);
        const first = m.channels[0]?.series[0];
        if (first) setActive({ channel: m.channels[0], series: first });
      })
      .catch((e) => console.error("manifest load failed", e));
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setSeriesData(null);
    setActiveEpisode(null);
    fetch(dataUrl(active.series.json))
      .then((r) => r.json())
      .then((d: SeriesData) => {
        if (!cancelled) setSeriesData(d);
      })
      .catch((e) => console.error("series load failed", e));
    return () => { cancelled = true; };
  }, [active]);

  // Once both the series JSON and the user's progress are loaded, decide
  // the starting episode/slide. Only runs once per series open
  // (gated by activeEpisode === null).
  useEffect(() => {
    if (!active || !seriesData || !progressLoaded) return;
    if (activeEpisode !== null) return;

    const saved = progress[active.series.slug];
    if (saved) {
      const exists = seriesData.episodes.some((e) => e.episode_number === saved.episode);
      if (exists) {
        setActiveEpisode(saved.episode);
        setInitialSlide(saved.slide);
        return;
      }
    }
    setActiveEpisode(seriesData.episodes[0]?.episode_number ?? null);
    setInitialSlide(0);
  }, [active, seriesData, progressLoaded, progress, activeEpisode]);

  const onSelectSeries = (a: { channel: Channel; series: SeriesEntry }) => {
    setActive(a);
    setDrawerOpen(false);
  };

  const onSelectEpisode = (n: number) => {
    setActiveEpisode(n);
    setInitialSlide(0);
  };

  return (
    <div className={"layout" + (drawerOpen ? " drawer-open" : "")}>
      <header className="topbar">
        <button
          className="hamburger"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="Toggle series menu"
        >
          <span /><span /><span />
        </button>
        <div className="topbar-title">
          {active ? active.series.name : "Tini Tiny Stories"}
        </div>
        <div className="topbar-spacer" />
        <AuthWidget
          user={user}
          loading={authLoading}
          signIn={signIn}
          signOut={signOut}
          compact
        />
      </header>

      <Sidebar
        manifest={manifest}
        active={active}
        onSelect={onSelectSeries}
        user={user}
        authLoading={authLoading}
        signIn={signIn}
        signOut={signOut}
        signedIn={!!user}
      />

      {drawerOpen && (
        <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      <main className="main">
        {active && active.series.requires_auth && !user && !authLoading ? (
          <SignInGate
            channel={active.channel}
            series={active.series}
            signIn={signIn}
          />
        ) : active && seriesData && activeEpisode !== null ? (
          <SeriesView
            channel={active.channel}
            series={active.series}
            data={seriesData}
            activeEpisode={activeEpisode}
            initialSlide={initialSlide}
            onSelectEpisode={onSelectEpisode}
            onSlideRead={(ep, slide) => recordProgress(active.series.slug, ep, slide)}
          />
        ) : (
          <div className="empty-state">{manifest ? "Loading…" : "Loading manifest…"}</div>
        )}
      </main>
    </div>
  );
};

const AuthWidget: React.FC<{
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
  compact?: boolean;
}> = ({ user, loading, signIn, signOut, compact }) => {
  if (loading) return <div className="auth-loading" aria-hidden="true" />;
  if (!user) {
    return (
      <button className={"sign-in-btn" + (compact ? " compact" : "")} onClick={signIn}>
        <GoogleIcon /> Sign in
      </button>
    );
  }
  return (
    <div className={"user-chip" + (compact ? " compact" : "")}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />
      ) : (
        <div className="user-avatar fallback">
          {(user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      {!compact && (
        <div className="user-meta">
          <div className="user-name">{user.displayName ?? user.email}</div>
          <button className="link-btn" onClick={signOut}>Sign out</button>
        </div>
      )}
      {compact && (
        <button className="link-btn compact-signout" onClick={signOut} aria-label="Sign out">↩</button>
      )}
    </div>
  );
};

const LockIcon: React.FC = () => (
  <svg
    className="lock-icon"
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z" />
  </svg>
);

const SignInGate: React.FC<{
  channel: Channel;
  series: SeriesEntry;
  signIn: () => void;
}> = ({ channel, series, signIn }) => {
  return (
    <div className="signin-gate">
      <div
        className="gate-card"
        style={{
          background: `linear-gradient(180deg, ${series.colors.bg_dark} 0%, #0a0a0a 100%)`,
          borderColor: `${series.colors.accent}33`,
        }}
      >
        <div className="gate-channel" style={{ color: series.colors.accent }}>
          {channel.name}
        </div>
        <h2 className="gate-title">{series.name}</h2>
        <div className="gate-tagline">{series.tagline}</div>

        <div className="gate-lock-row">
          <LockIcon />
          <span>Sign in to read this series</span>
        </div>

        <p className="gate-blurb">
          Free preview of <em>The Dropout</em> needs no account. Sign in with Google
          to unlock the rest of the catalog and pick up where you left off.
        </p>

        <button
          className="gate-signin-btn"
          onClick={signIn}
          style={{ borderColor: series.colors.accent }}
        >
          <GoogleIcon /> Sign in with Google
        </button>
      </div>
    </div>
  );
};

const GoogleIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.78 2.72v2.26h2.88c1.69-1.55 2.66-3.84 2.66-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.88-2.26c-.8.54-1.83.86-3.08.86-2.36 0-4.36-1.6-5.07-3.74H.91v2.34A8.99 8.99 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 0 1 3.64 9c0-.58.1-1.15.29-1.68V4.98H.91A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.91 4.02l3.02-2.34z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .91 4.98l3.02 2.34C4.64 5.18 6.64 3.58 9 3.58z" />
  </svg>
);

const Sidebar: React.FC<{
  manifest: Manifest | null;
  active: { channel: Channel; series: SeriesEntry } | null;
  onSelect: (a: { channel: Channel; series: SeriesEntry }) => void;
  user: ReturnType<typeof useAuth>["user"];
  authLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  signedIn: boolean;
}> = ({ manifest, active, onSelect, user, authLoading, signIn, signOut, signedIn }) => {
  return (
    <aside className="sidebar">
      <h1>Tini Tiny Stories</h1>
      <div className="sidebar-auth">
        <AuthWidget user={user} loading={authLoading} signIn={signIn} signOut={signOut} />
      </div>
      {manifest?.channels.map((c) => (
        <div key={c.slug} className="channel-block">
          <div className="channel-label">{c.name}</div>
          {c.series.map((s) => {
            const isActive = active?.series.slug === s.slug;
            const isLocked = s.requires_auth && !signedIn;
            return (
              <button
                key={s.slug}
                className={"sidebar-item" + (isActive ? " active" : "") + (isLocked ? " locked" : "")}
                onClick={() => onSelect({ channel: c, series: s })}
                style={isActive ? { borderLeftColor: s.colors.accent } : undefined}
              >
                <span className="name">
                  {isLocked && <LockIcon />}
                  {s.name}
                </span>
                <span className="count">{s.episode_count}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

const SeriesView: React.FC<{
  channel: Channel;
  series: SeriesEntry;
  data: SeriesData;
  activeEpisode: number;
  initialSlide: number;
  onSelectEpisode: (n: number) => void;
  onSlideRead: (episode: number, slide: number) => void;
}> = ({ channel, series, data, activeEpisode, initialSlide, onSelectEpisode, onSlideRead }) => {
  const episode = useMemo(
    () => data.episodes.find((e) => e.episode_number === activeEpisode) ?? data.episodes[0],
    [data, activeEpisode],
  );
  const nextEpisode = useMemo(() => {
    const i = data.episodes.findIndex((e) => e.episode_number === episode.episode_number);
    return i >= 0 && i < data.episodes.length - 1 ? data.episodes[i + 1] : null;
  }, [data, episode]);

  return (
    <div className="series-view">
      <header
        className="series-header"
        style={{
          background: `linear-gradient(180deg, ${series.colors.bg_dark} 0%, #0a0a0a 100%)`,
        }}
      >
        <div className="channel-tag" style={{ color: series.colors.accent }}>
          {channel.name}
        </div>
        <h2 className="series-title">{series.name}</h2>
        <div className="series-tagline">{series.tagline}</div>
      </header>

      <nav className="episode-strip" aria-label="Episodes">
        {data.episodes.map((e) => {
          const isActive = e.episode_number === episode.episode_number;
          return (
            <button
              key={e.episode_number}
              className={"episode-chip" + (isActive ? " active" : "")}
              onClick={() => onSelectEpisode(e.episode_number)}
              style={
                isActive
                  ? {
                      background: series.colors.accent,
                      borderColor: series.colors.accent,
                      color: series.colors.bg_dark,
                    }
                  : undefined
              }
            >
              <span className="ep-num">E{String(e.episode_number).padStart(2, "0")}</span>
              <span className="ep-title">{e.title}</span>
            </button>
          );
        })}
      </nav>

      <EpisodeStage
        episode={episode}
        series={series}
        initialSlide={initialSlide}
        nextEpisode={nextEpisode}
        onNext={nextEpisode ? () => onSelectEpisode(nextEpisode.episode_number) : undefined}
        onSlideRead={onSlideRead}
      />
    </div>
  );
};

const EpisodeStage: React.FC<{
  episode: Episode;
  series: SeriesEntry;
  initialSlide: number;
  nextEpisode: Episode | null;
  onNext?: () => void;
  onSlideRead: (episode: number, slide: number) => void;
}> = ({ episode, series, initialSlide, nextEpisode, onNext, onSlideRead }) => {
  return (
    <section className="episode-stage">
      <div className="ep-meta">
        {episode.synopsis && <p className="ep-synopsis">{episode.synopsis}</p>}
      </div>

      <div className="carousel-wrap">
        <Carousel
          slideCount={episode.slides.length}
          accent={series.colors.accent}
          resetKey={`${series.slug}-${episode.episode_number}`}
          initialSlide={initialSlide}
          onSlideChange={(i) => onSlideRead(episode.episode_number, i)}
        >
          {episode.slides.map((slide) => (
            <div key={slide.slide_number} className="slide-frame">
              <Slide
                slide={slide}
                totalSlides={episode.slides.length}
                colors={series.colors}
                seriesName={series.name}
                handle={series.handle}
                episodeNumber={episode.episode_number}
              />
            </div>
          ))}
        </Carousel>
      </div>

      {episode.caption && (
        <div className="ep-caption">
          <pre>{episode.caption}</pre>
          {episode.hashtags && (
            <div className="hashtags" style={{ color: series.colors.accent }}>
              {episode.hashtags.join(" ")}
            </div>
          )}
        </div>
      )}

      {nextEpisode && onNext && (
        <button
          className="next-episode-btn"
          onClick={onNext}
          style={{ borderColor: series.colors.accent, color: series.colors.accent }}
        >
          <span className="next-label">Next episode</span>
          <span className="next-title">
            E{String(nextEpisode.episode_number).padStart(2, "0")} · {nextEpisode.title}
          </span>
          <span className="next-arrow">→</span>
        </button>
      )}
    </section>
  );
};
