import { UI_FIELDS } from "../../shared/ui/field";
import { UI_BUTTONS } from "../../shared/ui/native-button";
import { ListView } from "../../shared/components/list-view";
import { PrivateReportComponent } from "../../shared/components/private-report";
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
import { MemberSession } from "../../core/auth/member-session";
import { parsePlaylistLink } from "../../core/utils/playlist-link";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { EnergyChart } from "../../shared/components/energy-chart";
@Component({
  selector: "app-playlist-page",
  imports: [
    ...UI_BUTTONS,
    ...UI_FIELDS,
    ListView,
    PrivateReportComponent,
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
  }>();
  readonly action = new ActionState();
  readonly feedbackAt = signal<"toolbar" | "comment">("toolbar");
  readonly deleting = signal(false);
  readonly commentVersion = signal(0);
  comment = "";
  readonly links = computed(() =>
    Object.values(this.page.data()?.playlist.links || {})
      .map(parsePlaylistLink)
      .filter((link) => link !== null),
  );
  constructor() {
    effect(() => {
      const id = this.params().get("id")!;
      this.comment = "";
      this.deleting.set(false);
      void this.load(id);
    });
  }
  load(id = this.params().get("id")!, retainData = false) {
    return this.page.run(async () => {
      const [playlist, profiles, saved] = await Promise.all([
        this.playlists.get(id),
        this.profiles.list(),
        this.social.savedIds(),
      ]);
      playlist.comments.sort(
        (a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "") ||
          a.id.localeCompare(b.id),
      );
      return { playlist, profiles, saved };
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
  addComment() {
    this.feedbackAt.set("comment");
    const data = this.page.data();
    if (!data) return;
    void this.action.run(async () => {
      await this.playlists.addComment(data.playlist.id, this.comment);
      this.comment = "";
      this.commentVersion.update((v) => v + 1);
      await this.load(data.playlist.id, true);
    }, "Comment added.");
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
