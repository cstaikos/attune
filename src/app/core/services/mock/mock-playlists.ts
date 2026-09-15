import {
  PlaylistService,
  PlaylistDraft,
  PlaylistQuery,
} from "../contracts/playlists";
import { ListeningReport, Playlist } from "../../models/library";
import { listeningGroups } from "../../models/taxonomy";
import { ServiceError } from "../service-error";
import {
  canViewHidden,
  findPlaylist,
  MockStore,
  requireUser,
} from "./mock-store";
import { cleanDraft } from "../../utils/playlist-draft";
import { queryPlaylists } from "../../utils/playlist-query";
function requireOwner(playlist: Playlist, userId: string): void {
  if (playlist.creatorId !== userId)
    throw new ServiceError(
      "forbidden",
      "Only the creator can change this playlist.",
    );
}
function updateWarnings(playlist: Playlist): void {
  playlist.warnings = {};
  for (const report of playlist.listeningReports)
    playlist.warnings[report.label] =
      (playlist.warnings[report.label] || 0) + 1;
}
export class MockPlaylists implements PlaylistService {
  constructor(private readonly store: MockStore) {}
  list(query: PlaylistQuery = {}) {
    return this.store.read("playlists.list", (s) =>
      queryPlaylists(
        {
          ...s,
          playlists: s.playlists
            .filter(
              (p) => canViewHidden(s) || !s.moderation?.hidden.includes(p.id),
            )
            .map((p) => ({
              ...p,
              hidden: !!s.moderation?.hidden.includes(p.id),
              comments: p.comments
                .map((c) => ({
                  ...c,
                  hidden: !!s.moderation?.hidden.includes(c.id),
                }))
                .filter(
                  (c) =>
                    canViewHidden(s) || !s.moderation?.hidden.includes(c.id),
                ),
            })),
        },
        requireUser(s),
        query,
      ),
    );
  }
  get(id: string) {
    return this.store.read("playlists.get", (s) => {
      requireUser(s);
      const p = findPlaylist(s, id);
      return {
        ...p,
        hidden: !!s.moderation?.hidden.includes(p.id),
        comments: p.comments
          .map((c) => ({ ...c, hidden: !!s.moderation?.hidden.includes(c.id) }))
          .filter(
            (c) => canViewHidden(s) || !s.moderation?.hidden.includes(c.id),
          ),
      };
    });
  }
  create(input: PlaylistDraft) {
    return this.store.write("playlists.create", (s) => {
      const userId = requireUser(s),
        draft = cleanDraft(input);
      const playlist: Playlist = {
        ...draft,
        id: crypto.randomUUID(),
        creatorId: userId,
        taxonomyVersion: 1,
        warnings: {},
        listeningReports: draft.creatorWarningLabels.map((label) => ({
          label,
          userId,
          context: "",
        })),
        savedCount: 0,
        createdAt: new Date().toISOString(),
        coverA: "#64765b",
        coverB: "#e6b56a",
        comments: [],
      };
      updateWarnings(playlist);
      s.playlists.unshift(playlist);
      return playlist;
    });
  }
  update(id: string, input: PlaylistDraft) {
    return this.store.write("playlists.update", (s) => {
      const userId = requireUser(s),
        playlist = findPlaylist(s, id);
      requireOwner(playlist, userId);
      const draft = cleanDraft(input);
      const unattributed = Object.fromEntries(
        Object.entries(playlist.warnings).filter(
          ([label]) =>
            !playlist.creatorWarningLabels.some((own) => own === label) &&
            !playlist.listeningReports.some((r) => r.label === label),
        ),
      );
      const reports = playlist.listeningReports.filter(
        (r) => r.userId !== userId,
      );
      const own = draft.creatorWarningLabels.map((label) => ({
        label,
        userId,
        context:
          playlist.listeningReports.find(
            (r) => r.userId === userId && r.label === label,
          )?.context || "",
      }));
      Object.assign(playlist, draft, {
        listeningReports: [...reports, ...own],
        updatedAt: new Date().toISOString(),
      });
      updateWarnings(playlist);
      playlist.warnings = { ...unattributed, ...playlist.warnings };
      return playlist;
    });
  }
  delete(id: string) {
    return this.store.write("playlists.delete", (s) => {
      const userId = requireUser(s);
      requireOwner(findPlaylist(s, id), userId);
      s.playlists = s.playlists.filter((p) => p.id !== id);
      s.saved = s.saved.filter((x) => x.playlistId !== id);
    });
  }
  addComment(id: string, body: string) {
    return this.store.write("playlists.addComment", (s) => {
      const userId = requireUser(s),
        playlist = findPlaylist(s, id);
      if (!body.trim() || body.length > 5000)
        throw new ServiceError(
          "invalid-input",
          "Comment must contain 1–5000 characters.",
        );
      const comment = {
        id: crypto.randomUUID(),
        userId,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      playlist.comments.push(comment);
      return comment;
    });
  }
  reportListeningNote(
    id: string,
    report: Pick<ListeningReport, "label" | "context">,
  ) {
    return this.store.write("playlists.reportListeningNote", (s) => {
      const userId = requireUser(s),
        playlist = findPlaylist(s, id);
      if (
        !Object.values(listeningGroups).some((group) =>
          Object.hasOwn(group, report.label),
        ) ||
        report.context.length > 1000
      )
        throw new ServiceError(
          "invalid-input",
          "Check the listening note and context.",
        );
      if (
        playlist.listeningReports.some(
          (r) => r.userId === userId && r.label === report.label,
        )
      )
        throw new ServiceError("conflict", "You already reported this note.");
      playlist.listeningReports.push({
        label: report.label,
        context: report.context.trim(),
        userId,
      });
      if (
        userId === playlist.creatorId &&
        !playlist.creatorWarningLabels.includes(report.label)
      )
        playlist.creatorWarningLabels.push(report.label);
      playlist.warnings[report.label] =
        (playlist.warnings[report.label] || 0) + 1;
    });
  }
}
