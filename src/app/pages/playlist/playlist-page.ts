import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TitleCasePipe } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  PLAYLIST_SERVICE,
  PROFILE_SERVICE,
  SOCIAL_SERVICE,
} from "../../core/services/service-tokens";
import { Playlist, Profile } from "../../core/models/library";
import { ListeningNoteLabel } from "../../core/models/taxonomy";
import { MemberSession } from "../../core/auth/member-session";
import { noteLabels } from "../../core/data/ui-options";
import { parsePlaylistLink } from "../../core/utils/playlist-link";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { EnergyChart } from "../../shared/components/energy-chart";
@Component({
  selector: "app-playlist-page",
  imports: [
    FormsModule,
    RouterLink,
    TitleCasePipe,
    PageStatus,
    ActionFeedback,
    EnergyChart,
  ],
  templateUrl: "./playlist-page.html",
})
export class PlaylistPage {
  private readonly playlists = inject(PLAYLIST_SERVICE);
  private readonly profiles = inject(PROFILE_SERVICE);
  private readonly social = inject(SOCIAL_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly member = inject(MemberSession);
  readonly page = new PageLoad<{
    playlist: Playlist;
    profiles: Profile[];
    saved: string[];
    followed: string[];
  }>();
  readonly action = new ActionState();
  readonly feedbackAt = signal<"toolbar" | "comment" | "report">("toolbar");
  readonly deleting = signal(false);
  comment = "";
  report: ListeningNoteLabel | "" = "";
  context = "";
  readonly links = computed(() =>
    Object.values(this.page.data()?.playlist.links || {})
      .map(parsePlaylistLink)
      .filter((link) => link !== null),
  );
  readonly warnings = computed(() =>
    Object.keys(this.page.data()?.playlist.warnings || {}),
  );
  readonly legacyWarnings = computed(() =>
    Object.keys(this.page.data()?.playlist.legacyWarnings || {}),
  );
  readonly available = computed(() =>
    noteLabels.filter(
      (label) =>
        !this.page
          .data()
          ?.playlist.listeningReports.some(
            (r) =>
              r.label === label && r.userId === this.member.session()?.userId,
          ),
    ),
  );
  constructor() {
    effect(() => {
      const id = this.params().get("id")!;
      this.comment = "";
      this.context = "";
      this.report = "";
      this.deleting.set(false);
      void this.load(id);
    });
  }
  load(id = this.params().get("id")!, retainData = false) {
    return this.page.run(async () => {
      const [playlist, profiles, saved, followed] = await Promise.all([
        this.playlists.get(id),
        this.profiles.list(),
        this.social.savedIds(),
        this.social.followedIds(),
      ]);
      return { playlist, profiles, saved, followed };
    }, retainData);
  }
  creator(id: string) {
    return this.page.data()?.profiles.find((p) => p.id === id);
  }
  name(id: string) {
    const profile = this.creator(id);
    return profile?.displayName || profile?.username || "Member";
  }
  save() {
    this.feedbackAt.set("toolbar");
    const data = this.page.data();
    if (!data) return;
    void this.action.run(async () => {
      await this.social.setSaved(
        data.playlist.id,
        !data.saved.includes(data.playlist.id),
      );
      await this.load(data.playlist.id, true);
    });
  }
  follow() {
    this.feedbackAt.set("toolbar");
    const data = this.page.data();
    if (!data) return;
    void this.action.run(async () => {
      await this.social.setFollowed(
        data.playlist.creatorId,
        !data.followed.includes(data.playlist.creatorId),
      );
      await this.load(data.playlist.id, true);
    });
  }
  addComment() {
    this.feedbackAt.set("comment");
    const data = this.page.data();
    if (!data) return;
    void this.action.run(async () => {
      await this.playlists.addComment(data.playlist.id, this.comment);
      this.comment = "";
      await this.load(data.playlist.id, true);
    }, "Comment added.");
  }
  addReport() {
    this.feedbackAt.set("report");
    const data = this.page.data();
    if (!data || !this.report) return;
    const label = this.report;
    void this.action.run(async () => {
      await this.playlists.reportListeningNote(data.playlist.id, {
        label,
        context: this.context,
      });
      this.context = "";
      this.report = "";
      await this.load(data.playlist.id, true);
    }, "Listening note added.");
  }
  remove() {
    this.feedbackAt.set("toolbar");
    const data = this.page.data();
    if (!data) return;
    void this.action.run(async () => {
      await this.playlists.delete(data.playlist.id);
      await this.router.navigateByUrl("/contributions");
    });
  }
}
