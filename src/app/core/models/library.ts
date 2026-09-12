import { ListeningNoteLabel, Modality, MusicTag } from "./taxonomy";

// Domain types are independent of Angular, storage, and any future API provider.
export type UserId = string;
export type PlaylistId = string;
export type MusicService = "spotify" | "youtube" | "apple" | "other";
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface Profile {
  id: UserId;
  username: string;
  displayName: string;
  practice: string;
  location: string;
  bio: string;
  initials: string;
  avatarUrl?: string;
  inviteCount: number;
  followerCount: number;
}

export interface Track {
  title: string;
  artist: string;
}

export interface PlaylistComment {
  id: string;
  userId: UserId;
  body: string;
  createdAt?: string;
}

export interface ListeningReport {
  label: ListeningNoteLabel;
  userId: UserId;
  context: string;
}

/** Current taxonomy only. Legacy browser data will need a migration at the service boundary. */
export interface Playlist {
  id: PlaylistId;
  creatorId: UserId;
  title: string;
  modality: Modality;
  energyCurve: EnergyLevel[];
  duration: string;
  qualities: MusicTag[];
  warnings: Partial<Record<ListeningNoteLabel, number>>;
  taxonomyVersion: 1;
  legacyQualities?: string[];
  legacyWarnings?: Record<string, number>;
  listeningReviewed: boolean;
  listeningContext: string;
  listeningReports: ListeningReport[];
  creatorWarningLabels: ListeningNoteLabel[];
  savedCount: number;
  createdAt: string;
  updatedAt?: string;
  coverA: string;
  coverB: string;
  notes: string;
  links: Partial<Record<MusicService, string>>;
  tracks: Track[];
  comments: PlaylistComment[];
}

export interface SavedPlaylist {
  userId: UserId;
  playlistId: PlaylistId;
}

export interface Follow {
  followerId: UserId;
  followedId: UserId;
}

export interface Invitation {
  id: string;
  code: string;
  createdBy: UserId;
  redeemedBy: UserId | null;
  expiresAt: string | null;
}

/** A session identifies the signed-in user; credentials are never part of profile data. */
export interface Session {
  userId: UserId;
}
