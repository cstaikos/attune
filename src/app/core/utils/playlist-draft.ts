import { PlaylistDraft } from "../services/contracts/playlists";
import { modalities, qualityGroups, listeningGroups } from "../models/taxonomy";
import { ServiceError } from "../services/service-error";
import { parsePlaylistLink } from "./playlist-link";
export function durationMinutes(value: string): number | null {
  const match = /^(?:(\d+)h\s*)?(?:(\d+)m)?$/.exec(value.trim());
  return match && (match[1] || match[2])
    ? Number(match[1] || 0) * 60 + Number(match[2] || 0)
    : null;
}
export function cleanDraft(input: PlaylistDraft): PlaylistDraft {
  const duration = durationMinutes(input.duration);
  const tags = Object.values(qualityGroups).flat();
  const labels = Object.values(listeningGroups).flatMap((group) =>
    Object.keys(group),
  );
  const links = Object.entries(input.links);
  if (
    !input.title.trim() ||
    !modalities.includes(input.modality) ||
    duration === null ||
    !Number.isSafeInteger(duration) ||
    duration <= 0 ||
    !input.qualities.length ||
    input.qualities.some((tag) => !tags.includes(tag)) ||
    (input.qualities.includes("no vocals") &&
      input.qualities.some((tag) =>
        ["wordless vocals", "sung lyrics", "spoken word"].includes(tag),
      )) ||
    input.energyCurve.length < 2 ||
    input.energyCurve.length > 24 ||
    input.energyCurve.some((n) => !Number.isInteger(n) || n < 1 || n > 5) ||
    input.creatorWarningLabels.some((label) => !labels.includes(label)) ||
    input.listeningContext.length > 1000 ||
    !links.length ||
    links.some(([key, url]) => parsePlaylistLink(url)?.key !== key)
  )
    throw new ServiceError(
      "invalid-input",
      "Check the title, duration, tags, energy curve, listening notes, and direct playlist links.",
    );
  return {
    title: input.title.trim(),
    modality: input.modality,
    duration: `${duration}m`,
    energyCurve: [...input.energyCurve],
    qualities: [...new Set(input.qualities)],
    notes: input.notes.trim(),
    links: Object.fromEntries(links.map(([key, url]) => [key, url.trim()])),
    tracks: input.tracks.map((track) => ({
      title: track.title.trim(),
      artist: track.artist.trim(),
    })),
    listeningReviewed: input.listeningReviewed,
    listeningContext: input.listeningContext.trim(),
    creatorWarningLabels: [...new Set(input.creatorWarningLabels)],
  };
}
