export type Colors = {
  bg_dark: string;
  bg_mid: string;
  text: string;
  accent: string;
  accent_dim: string;
};

export type SeriesEntry = {
  slug: string;
  name: string;
  tagline: string;
  concept: string;
  handle: string;
  episode_count: number;
  requires_auth: boolean;
  colors: Colors;
  json: string; // path relative to site root
};

export type Channel = {
  name: string;
  slug: string;
  default_handle: string;
  series: SeriesEntry[];
};

export type Manifest = {
  channels: Channel[];
};

export type Slide = {
  slide_number: number;
  section: string;
  text: string;
};

export type Episode = {
  episode_number: number;
  title: string;
  synopsis?: string;
  caption?: string;
  hashtags?: string[];
  slides: Slide[];
};

export type SeriesData = {
  series: {
    name: string;
    tagline: string;
    handle: string;
  };
  episodes: Episode[];
};
