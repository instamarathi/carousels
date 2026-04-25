import React from "react";
import type { Colors, Slide as SlideType } from "./types";

type SlideStyle = {
  bg_dark: string;
  bg_mid: string;
  text: string;
  accent: string;
  accent_dim: string;
};

function getSlideStyle(section: string, c: Colors): SlideStyle {
  if (section === "the_rule") {
    return {
      bg_dark: c.accent,
      bg_mid: c.accent,
      text: c.bg_dark,
      accent: c.bg_dark,
      accent_dim: c.bg_mid,
    };
  }
  return {
    bg_dark: c.bg_dark,
    bg_mid: c.bg_mid,
    text: c.text,
    accent: c.accent,
    accent_dim: c.accent_dim,
  };
}

function textSizeClass(section: string, text: string): string {
  if (section === "title") return "title";
  const len = text.length;
  if (len <= 120) return "large";
  if (len >= 400) return "xsmall";
  if (len >= 250) return "small";
  return "regular";
}

function formatParagraphs(text: string): React.ReactNode[] {
  const paras = text.trim().split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.map((p, i) => {
    const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
    return (
      <p key={i}>
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {line}
            {j < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export const Slide: React.FC<{
  slide: SlideType;
  totalSlides: number;
  colors: Colors;
  seriesName: string;
  handle: string;
  episodeNumber: number;
}> = ({ slide, totalSlides, colors, seriesName, handle, episodeNumber }) => {
  const s = getSlideStyle(slide.section, colors);
  const sizeKey = textSizeClass(slide.section, slide.text);
  const episodeTag = `S01·E${String(episodeNumber).padStart(2, "0")}`;

  const cssVars = {
    "--bg-dark": s.bg_dark,
    "--bg-mid": s.bg_mid,
    "--text": s.text,
    "--accent": s.accent,
    "--accent-dim": s.accent_dim,
  } as React.CSSProperties;

  return (
    <div className="slide" style={cssVars}>
      <div className="slide-bg-glow slide-bg-glow-tl" />
      <div className="slide-bg-glow slide-bg-glow-br" />
      <div className="slide-series-tag">{seriesName.toUpperCase()}</div>
      <div className={`slide-main-text slide-main-text-${sizeKey}`}>
        {formatParagraphs(slide.text)}
      </div>
      <div className="slide-episode-tag">{episodeTag}</div>
      <div className="slide-page-num">{slide.slide_number}/{totalSlides}</div>
      <div className="slide-handle">{handle}</div>
    </div>
  );
};
