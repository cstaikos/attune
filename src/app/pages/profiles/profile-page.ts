import { Component, effect, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  PLAYLIST_SERVICE,
  PROFILE_SERVICE,
  SOCIAL_SERVICE,
  INVITATION_SERVICE,
} from "../../core/services/service-tokens";
import { Profile, Playlist, Invitation } from "../../core/models/library";
import { MemberSession } from "../../core/auth/member-session";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { PlaylistCard } from "../../shared/components/playlist-card";
@Component({
  selector: "app-profile-page",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageStatus,
    ActionFeedback,
    PlaylistCard,
  ],
  templateUrl: "./profile-page.html",
})
export class ProfilePage {
  private readonly profiles = inject(PROFILE_SERVICE);
  private readonly playlists = inject(PLAYLIST_SERVICE);
  private readonly social = inject(SOCIAL_SERVICE);
  private readonly invitations = inject(INVITATION_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly member = inject(MemberSession);
  readonly editing = signal(false);
  readonly action = new ActionState();
  readonly page = new PageLoad<{
    profile: Profile;
    playlists: Playlist[];
    saved: string[];
    invitations: Invitation[];
  }>();
  readonly form = inject(FormBuilder).nonNullable.group({
    displayName: [""],
    practice: ["", Validators.required],
    location: [""],
    bio: [""],
  });
  constructor() {
    effect(() => {
      const id = this.params().get("id")!;
      this.editing.set(false);
      void this.load(id);
    });
  }
  load(id = this.params().get("id")!, retainData = false) {
    return this.page.run(async () => {
      const [profile, playlists, saved, invitations] = await Promise.all([
        this.profiles.get(id),
        this.playlists.list({ creatorId: id }),
        this.social.savedIds(),
        id === this.member.session()?.userId
          ? this.invitations.listMine()
          : Promise.resolve([]),
      ]);
      return { profile, playlists, saved, invitations };
    }, retainData);
  }
  edit() {
    const profile = this.page.data()!.profile;
    this.form.reset({
      displayName: profile.displayName,
      practice: profile.practice,
      location: profile.location,
      bio: profile.bio,
    });
    this.editing.set(true);
  }
  update() {
    if (this.form.invalid) return;
    void this.action.run(async () => {
      await this.profiles.updateMine(this.form.getRawValue());
      this.editing.set(false);
      await Promise.all([this.member.refresh(), this.load(undefined, true)]);
    }, "Profile updated.");
  }
  save(playlist: Playlist) {
    const saved = this.page.data()!.saved.includes(playlist.id);
    void this.action.run(async () => {
      await this.social.setSaved(playlist.id, !saved);
      await this.load(undefined, true);
    });
  }
  invite() {
    void this.action.run(async () => {
      await this.invitations.create();
      await this.load(undefined, true);
    }, "Invitation created. Select and copy its code below.");
  }
}
