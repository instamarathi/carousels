import { useEffect, useState } from "react";

export type Route =
  | { kind: "home" }
  | { kind: "series"; slug: string };

function parseHash(hash: string): Route {
  const m = hash.match(/^#\/series\/(.+)$/);
  if (m) return { kind: "series", slug: decodeURIComponent(m[1]) };
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

export function navigateTo(route: Route) {
  if (route.kind === "home") {
    if (window.location.hash) {
      window.location.hash = "";
    }
  } else if (route.kind === "series") {
    window.location.hash = `#/series/${encodeURIComponent(route.slug)}`;
  }
  // Always scroll to top on route change.
  window.scrollTo(0, 0);
}
