import { MusicService } from "../models/library";
export function parsePlaylistLink(
  value: string,
): { key: MusicService; label: string; href: string } | null {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    if (host === "open.spotify.com") {
      if (!/^\/(?:intl-[a-z-]+\/)?playlist\/[a-zA-Z0-9]+\/?$/.test(path))
        return null;
      return { key: "spotify", label: "Spotify", href: url.href };
    }
    if (
      [
        "youtube.com",
        "www.youtube.com",
        "music.youtube.com",
        "youtu.be",
      ].includes(host)
    ) {
      if (
        !url.searchParams.get("list") ||
        (!["/playlist", "/watch", "/"].includes(path) && host !== "youtu.be")
      )
        return null;
      return { key: "youtube", label: "YouTube", href: url.href };
    }
    if (host === "music.apple.com") {
      if (!/^\/(?:[a-z]{2}\/)?playlist\/.+/.test(path)) return null;
      return { key: "apple", label: "Apple Music", href: url.href };
    }
    if (path === "/" || !path) return null;
    return { key: "other", label: host, href: url.href };
  } catch {
    return null;
  }
}
