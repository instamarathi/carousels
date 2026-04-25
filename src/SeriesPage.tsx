import React, { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { Carousel } from "./Carousel";
import { Slide } from "./Slide";
import { LockIcon, GoogleIcon } from "./icons";
import { navigateTo } from "./useHashRoute";
import type { Category, Manifest, SeriesData, SeriesEntry } from "./types";
import type { ProgressMap } from "./useProgress";

function dataUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + "/" + path;
}

export const SeriesPage: React.FC<{
  slug: string;
  manifest: Manifest | null;
  user: User | null;
  authLoading: boolean;
  signIn: () => void;
  progress: ProgressMap;
  progressLoaded: boolean;
  recordProgress: (slug: string, ep: number, slide: number, slidesInEpisode: number) => void;
}> = ({ slug, manifest, user, authLoading, signIn, progress, progressLoaded, recordProgress }) => {
  const found = useMemo(() => {
    if (!manifest) return null;
    for (const category of manifest.categories) {
      const series = category.series.find((s) => s.slug === slug);
      if (series) return { category, series };
    }
    return null;
  }, [manifest, slug]);

  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null);
  const [initialSlide, setInitialSlide] = useState(0);

  useEffect(() => {
    if (!found) return;
    let cancelled = false;
    setSeriesData(null);
    setActiveEpisode(null);
    fetch(dataUrl(found.series.json))
      .then((r) => r.json())
      .then((d: SeriesData) => {
        if (!cancelled) setSeriesData(d);
      })
      .catch((e) => console.error("series load failed", e));
    return () => { cancelled = true; };
  }, [found]);

  // Once both series JSON and progress are loaded, pick a starting episode.
  useEffect(() => {
    if (!found || !seriesData || !progressLoaded) return;
    if (activeEpisode !== null) return;
    const saved = progress[found.series.slug];
    if (saved && seriesData.episodes.some((e) => e.episode_number === saved.episode)) {
      setActiveEpisode(saved.episode);
      setInitialSlide(saved.slide);
      return;
    }
    setActiveEpisode(seriesData.episodes[0]?.episode_number ?? null);
    setInitialSlide(0);
  }, [found, seriesData, progressLoaded, progress, activeEpisode]);

  if (!manifest) return <div className="empty-state">Loading manifest…</div>;
  if (!found) {
    return (
      <div className="empty-state column">
        <p>Series not found.</p>
        <button className="link-btn" onClick={() => navigateTo({ kind: "home" })}>
          ← Back to all series
        </button>
      </div>
    );
  }

  if (found.series.requires_auth && !user && !authLoading) {
    return <SignInGate category={found.category} series={found.series} signIn={signIn} />;
  }

  if (!seriesData || activeEpisode === null) {
    return <div className="empty-state">Loading…</div>;
  }

  return (
    <SeriesContent
      category={found.category}
      series={found.series}
      data={seriesData}
      activeEpisode={activeEpisode}
      initialSlide={initialSlide}
      onSelectEpisode={(n) => {
        setActiveEpisode(n);
        setInitialSlide(0);
      }}
      onSlideRead={(ep, slide, slidesInEpisode) =>
        recordProgress(found.series.slug, ep, slide, slidesInEpisode)
      }
    />
  );
};

const SeriesContent: React.FC<{
  category: Category;
  series: SeriesEntry;
  data: SeriesData;
  activeEpisode: number;
  initialSlide: number;
  onSelectEpisode: (n: number) => void;
  onSlideRead: (episode: number, slide: number, slidesInEpisode: number) => void;
}> = ({ category, series, data, activeEpisode, initialSlide, onSelectEpisode, onSlideRead }) => {
  const episode = useMemo(
    () => data.episodes.find((e) => e.episode_number === activeEpisode) ?? data.episodes[0],
    [data, activeEpisode],
  );
  const nextEpisode = useMemo(() => {
    const i = data.episodes.findIndex((e) => e.episode_number === episode.episode_number);
    return i >= 0 && i < data.episodes.length - 1 ? data.episodes[i + 1] : null;
  }, [data, episode]);

  return (
    <div className="series-page">
      <header
        className="series-header"
        style={{
          background: `linear-gradient(180deg, ${series.colors.bg_dark} 0%, #0a0a0a 100%)`,
        }}
      >
        <button className="back-link" onClick={() => navigateTo({ kind: "home" })}>
          ← All series
        </button>
        <div className="channel-tag" style={{ color: series.colors.accent }}>
          {category.name}
        </div>
        <h2 className="series-title">{series.name}</h2>
        <div className="series-tagline">{series.tagline}</div>
      </header>

      <div className="series-body">
        <aside className="episodes-rail" aria-label="Episodes">
          <div className="rail-label">Episodes · {data.episodes.length}</div>
          <div className="rail-list">
            {data.episodes.map((e) => {
              const isActive = e.episode_number === episode.episode_number;
              return (
                <button
                  key={e.episode_number}
                  className={"rail-item" + (isActive ? " active" : "")}
                  onClick={() => onSelectEpisode(e.episode_number)}
                  style={isActive ? { borderLeftColor: series.colors.accent } : undefined}
                >
                  <span className="rail-num">
                    E{String(e.episode_number).padStart(2, "0")}
                  </span>
                  <span className="rail-title">{e.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="episode-stage">
          <div className="ep-meta">
            <div className="ep-tag" style={{ color: series.colors.accent }}>
              EPISODE {episode.episode_number}
            </div>
            <h3 className="ep-headline">{episode.title}</h3>
            {episode.synopsis && <p className="ep-synopsis">{episode.synopsis}</p>}
          </div>

          <div className="carousel-wrap">
            <Carousel
              slideCount={episode.slides.length}
              accent={series.colors.accent}
              resetKey={`${series.slug}-${episode.episode_number}`}
              initialSlide={initialSlide}
              onSlideChange={(i) => onSlideRead(episode.episode_number, i, episode.slides.length)}
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

          {nextEpisode && (
            <button
              className="next-episode-btn"
              onClick={() => onSelectEpisode(nextEpisode.episode_number)}
              style={{
                borderColor: series.colors.accent,
                color: series.colors.accent,
              }}
            >
              <span className="next-label">Next episode</span>
              <span className="next-title">
                E{String(nextEpisode.episode_number).padStart(2, "0")} · {nextEpisode.title}
              </span>
              <span className="next-arrow">→</span>
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

const SignInGate: React.FC<{
  category: Category;
  series: SeriesEntry;
  signIn: () => void;
}> = ({ category, series, signIn }) => {
  return (
    <div className="signin-gate">
      <button className="back-link top" onClick={() => navigateTo({ kind: "home" })}>
        ← All series
      </button>
      <div
        className="gate-card"
        style={{
          background: `linear-gradient(180deg, ${series.colors.bg_dark} 0%, #0a0a0a 100%)`,
          borderColor: `${series.colors.accent}33`,
        }}
      >
        <div className="gate-channel" style={{ color: series.colors.accent }}>
          {category.name}
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
