import { SupabaseClient } from "@supabase/supabase-js";
import {
  ListeningReport,
  Playlist,
  PlaylistComment,
  SavedPlaylist,
} from "../../models/library";
import {
  PlaylistService,
  PlaylistDraft,
  PlaylistQuery,
} from "../contracts/playlists";
import { cleanDraft, durationMinutes } from "../../utils/playlist-draft";
import { queryPlaylists } from "../../utils/playlist-query";
import { result, rows, userId } from "./database";
import { SupabaseProfiles } from "./supabase-profiles";
interface CommentRow {
  hidden: boolean;
  id: string;
  user_id: string;
  body: string;
  warning: boolean;
  created_at: string;
}
interface ReportRow {
  label: ListeningReport["label"];
  user_id: string;
  context: string;
}
interface PlaylistRow {
  hidden: boolean;
  id: string;
  creator_id: string;
  title: string;
  modality: Playlist["modality"];
  duration_minutes: number;
  energy_curve: Playlist["energyCurve"];
  qualities: Playlist["qualities"];
  listening_reviewed: boolean;
  listening_context: string;
  notes: string;
  links: Playlist["links"];
  tracks: Playlist["tracks"];
  cover_a: string;
  cover_b: string;
  created_at: string;
  updated_at: string;
}
const comment = (row: CommentRow): PlaylistComment => ({
  hidden: row.hidden,
  id: row.id,
  userId: row.user_id,
  body: row.body,
  warning: row.warning,
  createdAt: row.created_at,
});
export class SupabasePlaylists implements PlaylistService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly profiles: SupabaseProfiles,
  ) {}
  private async map(row: PlaylistRow): Promise<Playlist> {
    const [comments, reports, count] = await Promise.all([
      rows<CommentRow>(this.client, "playlist_comments", "*", "created_at,id", {
        column: "playlist_id",
        value: row.id,
      }),
      rows<ReportRow>(this.client, "listening_reports", "*", "user_id,label", {
        column: "playlist_id",
        value: row.id,
      }),
      result(this.client.rpc("playlist_save_count", { playlist_id: row.id })),
    ]);
    const listeningReports: ListeningReport[] = (reports as ReportRow[]).map(
      (r) => ({ label: r.label, userId: r.user_id, context: r.context }),
    );
    const warnings: Playlist["warnings"] = {};
    for (const report of listeningReports)
      warnings[report.label] = (warnings[report.label] || 0) + 1;
    return {
      hidden: row.hidden,
      id: row.id,
      creatorId: row.creator_id,
      title: row.title,
      modality: row.modality,
      duration: `${row.duration_minutes}m`,
      energyCurve: row.energy_curve,
      qualities: row.qualities,
      taxonomyVersion: 1,
      listeningReviewed: row.listening_reviewed,
      listeningContext: row.listening_context,
      notes: row.notes,
      links: row.links,
      tracks: row.tracks,
      coverA: row.cover_a,
      coverB: row.cover_b,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      savedCount: Number(count),
      comments: (comments as CommentRow[]).map(comment),
      listeningReports,
      warnings,
      creatorWarningLabels: listeningReports
        .filter((r) => r.userId === row.creator_id)
        .map((r) => r.label),
    };
  }
  async list(query: PlaylistQuery = {}) {
    const actor = await userId(this.client);
    const [data, profiles, saves] = await Promise.all([
      rows<PlaylistRow>(this.client, "playlists"),
      this.profiles.list(),
      rows<{ playlist_id: string }>(
        this.client,
        "saved_playlists",
        "playlist_id",
        "playlist_id",
      ),
    ]);
    const playlists = await Promise.all(data.map((row) => this.map(row)));
    const saved: SavedPlaylist[] = saves.map((row) => ({
      userId: actor,
      playlistId: row.playlist_id,
    }));
    return queryPlaylists({ playlists, profiles, saved }, actor, query);
  }
  async get(id: string) {
    return this.map(
      (await result(
        this.client.from("playlists").select("*").eq("id", id).single(),
      )) as PlaylistRow,
    );
  }
  private async save(id: string | null, input: PlaylistDraft) {
    const draft = cleanDraft(input);
    const row = await result(
      this.client.rpc("save_playlist", {
        playlist_id: id,
        draft: {
          title: draft.title,
          modality: draft.modality,
          duration_minutes: durationMinutes(draft.duration),
          energy_curve: draft.energyCurve,
          qualities: draft.qualities,
          listening_reviewed: draft.listeningReviewed,
          listening_context: draft.listeningContext,
          notes: draft.notes,
          links: draft.links,
          tracks: draft.tracks,
        },
        warning_labels: draft.creatorWarningLabels,
      }),
    );
    return this.get(row.id);
  }
  create(draft: PlaylistDraft) {
    return this.save(null, draft);
  }
  update(id: string, draft: PlaylistDraft) {
    return this.save(id, draft);
  }
  async delete(id: string) {
    await result(
      this.client.from("playlists").delete().eq("id", id).select("id").single(),
    );
  }
  async addComment(id: string, body: string) {
    return comment(
      (await result(
        this.client
          .from("playlist_comments")
          .insert({ playlist_id: id, body: body.trim() })
          .select("*")
          .single(),
      )) as CommentRow,
    );
  }
  async reportListeningNote(
    id: string,
    report: Pick<ListeningReport, "label" | "context">,
  ) {
    await result(
      this.client.from("listening_reports").insert({
        playlist_id: id,
        label: report.label,
        context: report.context.trim(),
      }),
    );
  }
}
