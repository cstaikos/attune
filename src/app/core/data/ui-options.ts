import { MusicService } from "../models/library";
import {
  modalities,
  qualityGroups,
  listeningGroups,
  MusicTag,
  ListeningNoteLabel,
} from "../models/taxonomy";
export { modalities };
export const musicGroups = Object.entries(qualityGroups).map(
  ([name, tags]) => ({ name, tags: tags as readonly MusicTag[] }),
);
export const noteGroups = Object.entries(listeningGroups).map(
  ([name, definitions]) => ({
    name,
    notes: Object.entries(definitions).map(([label, description]) => ({
      label: label as ListeningNoteLabel,
      description,
    })),
  }),
);
export const noteLabels = noteGroups.flatMap((g) =>
  g.notes.map((n) => n.label),
);
export const services: { value: MusicService; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "youtube", label: "YouTube" },
  { value: "apple", label: "Apple Music" },
  { value: "other", label: "Other service" },
];
