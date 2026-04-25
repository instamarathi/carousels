import { useEffect, useState } from "react";

export type Route =
  | { kind: "home" }
  | { kind: "series"; slug: string; episode?: number };

function parseHash(hash: string): Route {
  const m = hash.match(/^#\/series\/([^/]+)(?:\/e\/(\d+))?$/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const episode = m[2] ? Number(m[2]) : undefined;
    return { kind: "series", slug, episode };
  }
  return { kind: "home" };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function buildHash(route: Route): string {
  if (route.kind === "home") return "";
  let h = `#/series/${encodeURIComponent(route.slug)}`;
  if (route.episode !== undefined) h += `/e/${route.episode}`;
  return h;
}

export function navigateTo(route: Route, opts: { scroll?: boolean } = {}) {
  const { scroll = true } = opts;
  const target = buildHash(route);
  if (route.kind === "home") {
    if (window.location.hash) window.location.hash = "";
  } else if (target !== window.location.hash) {
    window.location.hash = target;
  }
  if (scroll) window.scrollTo(0, 0);
}

export function replaceRoute(route: Route) {
  const target = buildHash(route);
  const url = window.location.pathname + window.location.search + (target || "");
  window.history.replaceState(null, "", url);
}
