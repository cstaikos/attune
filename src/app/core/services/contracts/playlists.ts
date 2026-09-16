import {
  Playlist,
  PlaylistComment,
  PlaylistId,
  ListeningReport,
  MusicService,
} from "../../models/library";
import { Modality, MusicTag, ListeningNoteLabel } from "../../models/taxonomy";
export type PlaylistDraft = Pick<
  Playlist,
  | "title"
  | "modality"
  | "energyCurve"
  | "energyLabels"
  | "duration"
  | "qualities"
  | "notes"
  | "links"
  | "tracks"
  | "listeningReviewed"
  | "listeningContext"
  | "creatorWarningLabels"
>;
export interface PlaylistQuery {
  search?: string;
  modality?: Modality;
  qualities?: MusicTag[];
  excludedQualities?: MusicTag[];
  excludedWarnings?: ListeningNoteLabel[];
  services?: MusicService[];
  minDuration?: number;
  maxDuration?: number;
  view?: "library" | "saved" | "contributions";
  creatorId?: string;
  sort?: "newest" | "favorites" | "comments";
}
export interface PlaylistService {
  list(query?: PlaylistQuery): Promise<Playlist[]>;
  get(id: PlaylistId): Promise<Playlist>;
  create(draft: PlaylistDraft): Promise<Playlist>;
  update(id: PlaylistId, draft: PlaylistDraft): Promise<Playlist>;
  delete(id: PlaylistId): Promise<void>;
  addComment(id: PlaylistId, body: string): Promise<PlaylistComment>;
  reportListeningNote(
    id: PlaylistId,
    report: Pick<ListeningReport, "label" | "context">,
  ): Promise<void>;
}
