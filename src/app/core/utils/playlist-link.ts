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
    if (host === "open.spotify.com") {
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
      return { key: "youtube", label: "YouTube", href: url.href };
    }
    if (host === "music.apple.com") {
      return { key: "apple", label: "Apple Music", href: url.href };
    }
    return { key: "other", label: host, href: url.href };
  } catch {
    return null;
  }
}
