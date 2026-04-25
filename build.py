"""
Build trimmed JSON data for the GitHub Pages carousel site.

Walks the source instagram repo, extracts only the fields needed for
client-side rendering, and writes them under carousels/data/.

Usage:
    uv run python build.py                 # build all known series
    uv run python build.py the_dropout     # build only specific series (by slug)
"""

import argparse
import json
import re
import sys
from pathlib import Path

SOURCE_ROOT = Path("/Users/anup/instagram")
OUT_ROOT = Path(__file__).parent / "public" / "data"

CONTENT_ROOTS = [
    {
        "name": "Tini Tiny Series",
        "slug": "tini_tiny_series",
        "default_handle": "@tini_tiny_series",
        "path": SOURCE_ROOT / "series",
    },
    {
        "name": "One Level Deeper",
        "slug": "one_level_deeper",
        "default_handle": "@go.one.level.deeper",
        "path": SOURCE_ROOT / "one_level_deeper" / "series",
    },
    {
        "name": "The Unwritten Rules",
        "slug": "the_unwritten_rules",
        "default_handle": "@the.unwritten.rules",
        "path": SOURCE_ROOT / "the_unwritten_rules" / "series",
    },
]

# Color palettes copied from generate_carousel.py:
#   (bg_dark, bg_mid, text, accent, accent_dim)
SERIES_COLORS = {
    "chai pe charcha":          ("#1a0f0a", "#2d1810", "#f5e6d3", "#c8956c", "#8a6e5a"),
    "adapt or die":             ("#0a0f1a", "#101825", "#e0e8f0", "#4a9eff", "#5a7a9a"),
    "adaalat 2.0":              ("#0a0a0a", "#1a1215", "#e8e0d8", "#cc3333", "#8a5a5a"),
    "room 307":                 ("#0f0a1a", "#1a1028", "#e0d8f0", "#9b59b6", "#6a4a7a"),
    "the algorithm":            ("#0a1a1a", "#0f2828", "#d8f0ee", "#00bcd4", "#4a8a8a"),
    "gully cricket diaries":    ("#0a1a0f", "#142818", "#d8f0dd", "#4caf50", "#5a8a5e"),
    "3000 bce":                 ("#1a150a", "#28200f", "#f0e8d0", "#d4a017", "#8a7a4a"),
    "the flat":                 ("#1a100a", "#28180f", "#f0e0d0", "#ff7043", "#8a6050"),
    "100 crore startup":        ("#0a1a12", "#0f2820", "#d8f0e8", "#26a69a", "#4a8a80"),
    "bharat ka naksha":         ("#1a120a", "#281a0f", "#f0e4d0", "#ff9800", "#8a7050"),
    "math behind everything":   ("#120a1a", "#1a0f28", "#e8d8f0", "#7c4dff", "#6a4a8a"),
    "last seen online":         ("#0a1a0f", "#102810", "#d8f0d8", "#76ff03", "#5a8a50"),
    "rupee mein kya milta tha": ("#1a140a", "#28200f", "#f0e8d0", "#ffc107", "#8a7840"),
    "the night shift":          ("#060a14", "#0a1020", "#c8d0e0", "#5c6bc0", "#4a5070"),
    "scam 101":                 ("#1a0a0a", "#280f0f", "#f0d8d8", "#ef5350", "#8a5050"),
    "two minutes before":       ("#1a0a0e", "#280f18", "#f0d8e0", "#e91e63", "#8a4a5a"),
    "dadi ke nuskhe vs science":("#0f1a0a", "#1a280f", "#e0f0d8", "#8bc34a", "#6a8a4a"),
    "the interviewer":          ("#0f0f12", "#1a1a20", "#e0e0e4", "#90a4ae", "#6a7078"),
    "what if india":            ("#1a0f0a", "#281810", "#f0e4d4", "#ff6f00", "#8a6040"),
    "paise ki baat":            ("#0a1a10", "#0f2818", "#d8f0e0", "#00c853", "#4a8a5a"),
    "the comment section":      ("#140a1a", "#200f28", "#e8d0f0", "#e040fb", "#7a4a8a"),
    "the dropout":              ("#1a100a", "#281c0f", "#f0e4d0", "#ff8f00", "#8a6840"),
    "the last day":             ("#1a0a0a", "#280f10", "#f0d8d8", "#b71c1c", "#8a4a4a"),
    "teacher":                  ("#1a150f", "#2a2018", "#f0e8d8", "#c4a87a", "#8a7a5e"),
    "greener grass":            ("#0a1a0f", "#142818", "#d8f0dd", "#4caf50", "#5a8a5e"),
    "second shift":             ("#0f1a1a", "#182828", "#d8f0f0", "#26c6da", "#4a8a8a"),
    "delivery":                 ("#1a0f14", "#28182a", "#f0d8e8", "#ce93d8", "#8a5a7a"),
    "happier times":            ("#1a140a", "#2d2010", "#f5e6c8", "#c4a265", "#8b7355"),
    "meter down":               ("#1a100a", "#2c1810", "#f5e6d0", "#e8985e", "#8b6914"),
    "wait what":                ("#0a0e1a", "#101828", "#e8eef4", "#00d4aa", "#4a8a7a"),
    "one equation":             ("#0a0e1a", "#101828", "#e8eef4", "#ffd54f", "#8a7a4a"),
    "the thought experiment":   ("#0a0e1a", "#101828", "#e8eef4", "#b388ff", "#6a4a8a"),
    "the infinite":             ("#0a0e1a", "#101828", "#e8eef4", "#18ffff", "#4a8a8a"),
    "game theory":              ("#0a0e1a", "#101828", "#e8eef4", "#ff8a65", "#8a6050"),
    "how markets really work":  ("#0a0e1a", "#101828", "#e8eef4", "#69f0ae", "#4a8a5a"),
    "proof and truth":          ("#0a0e1a", "#101828", "#e8eef4", "#ea80fc", "#7a4a8a"),
    "the grove method":         ("#1a1a2e", "#2a2a3e", "#e0e0e0", "#f0a500", "#8a7a4a"),
    "the hiring table":         ("#2c2c2c", "#3a3a3a", "#f0ebe3", "#d4a853", "#8b7355"),
    "mahanagarpalika 101":      ("#2c2418", "#3a3028", "#f0e8d8", "#c0392b", "#8b7355"),
    "the career edge":          ("#0a0a14", "#121220", "#e8eef4", "#00e676", "#4a8a5a"),
    "the new manager":          ("#1a1a1a", "#252525", "#e8eef4", "#d4a056", "#8a7040"),
    "before the signboard":     ("#1c1c1c", "#2a2520", "#e8dfd5", "#c47a3a", "#6b5b4f"),
    "beyond the marks":         ("#1a1f36", "#2d3249", "#f0ead6", "#d4a843", "#7a8499"),
    "the quiet hours":          ("#1a2a3a", "#2d3a3e", "#f0e8dc", "#d4a574", "#7a8f9a"),
    "they grow up":             ("#1e1c1a", "#2a2725", "#ece5db", "#c49a4a", "#7a6b55"),
    "lucky hai kya":            ("#1a1a1e", "#2a2a30", "#e8e8ec", "#c0c0c8", "#6a6a72"),
    "ego down":                 ("#f5efe6", "#f5efe6", "#2a2018", "#c47a8a", "#a85a6a"),
    "tamasha":                  ("#1a0510", "#40081e", "#f5e6c8", "#e8332e", "#d4a855"),
}
DEFAULT_COLORS = ("#0a0f1a", "#101825", "#e0e8f0", "#4a9eff", "#5a7a9a")

# Series that anyone can read without signing in.
FREE_SERIES = {"the_dropout"}


def get_colors(series_name: str):
    name_lower = series_name.lower()
    for key, colors in SERIES_COLORS.items():
        if key in name_lower or name_lower in key:
            return colors
    return DEFAULT_COLORS


def trim_slide(slide: dict) -> dict:
    return {
        "slide_number": slide.get("slide_number"),
        "section": slide.get("section", ""),
        "text": slide.get("text", ""),
    }


def trim_episode(ep: dict) -> dict:
    out = {
        "episode_number": ep.get("episode_number"),
        "title": ep.get("title", ""),
        "slides": [trim_slide(s) for s in ep.get("slides", [])],
    }
    if ep.get("synopsis"):
        out["synopsis"] = ep["synopsis"]
    if ep.get("caption"):
        out["caption"] = ep["caption"]
    if ep.get("hashtags"):
        out["hashtags"] = ep["hashtags"]
    return out


def trim_series(data: dict, default_handle: str) -> dict:
    series = data.get("series", {})
    handle = series.get("engagement", {}).get("handle", default_handle)
    return {
        "series": {
            "name": series.get("name", ""),
            "tagline": series.get("tagline", ""),
            "concept": series.get("concept", ""),
            "handle": handle,
        },
        "episodes": [trim_episode(e) for e in data.get("episodes", [])],
    }


def build_series(channel: dict, series_dir: Path, only: set[str] | None) -> dict | None:
    slug = series_dir.name
    if only and slug not in only:
        return None

    json_path = series_dir / "idea.json"
    if not json_path.exists():
        return None

    with open(json_path) as f:
        try:
            raw = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  skip {slug}: invalid JSON ({e})", file=sys.stderr)
            return None

    trimmed = trim_series(raw, channel["default_handle"])
    out_dir = OUT_ROOT / channel["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.json"
    with open(out_path, "w") as f:
        json.dump(trimmed, f, ensure_ascii=False, separators=(",", ":"))

    name = trimmed["series"]["name"]
    bg_dark, bg_mid, text, accent, accent_dim = get_colors(name)
    # Path that the browser will fetch (relative to the site root).
    rel_path = "data/" + out_path.relative_to(OUT_ROOT).as_posix()

    return {
        "slug": slug,
        "name": name,
        "tagline": trimmed["series"]["tagline"],
        "concept": trimmed["series"]["concept"],
        "handle": trimmed["series"]["handle"],
        "episode_count": len(trimmed["episodes"]),
        "requires_auth": slug not in FREE_SERIES,
        "colors": {
            "bg_dark": bg_dark,
            "bg_mid": bg_mid,
            "text": text,
            "accent": accent,
            "accent_dim": accent_dim,
        },
        "json": rel_path,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("only", nargs="*", help="Series slugs to build (default: all)")
    args = parser.parse_args()
    only = set(args.only) if args.only else None

    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    manifest = {"channels": []}
    total = 0

    for channel in CONTENT_ROOTS:
        if not channel["path"].exists():
            continue

        chan_entry = {
            "name": channel["name"],
            "slug": channel["slug"],
            "default_handle": channel["default_handle"],
            "series": [],
        }

        for series_dir in sorted(channel["path"].iterdir()):
            if not series_dir.is_dir():
                continue
            entry = build_series(channel, series_dir, only)
            if entry:
                chan_entry["series"].append(entry)
                total += 1

        if chan_entry["series"]:
            manifest["channels"].append(chan_entry)

    manifest_path = OUT_ROOT / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    size_kb = sum(p.stat().st_size for p in OUT_ROOT.rglob("*.json")) / 1024
    print(f"Built {total} series across {len(manifest['channels'])} channels")
    print(f"Manifest: {manifest_path}")
    print(f"Total data size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
