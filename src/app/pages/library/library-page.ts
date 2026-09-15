import { UI_FIELDS } from "../../shared/ui/field";
import { UI_BUTTONS } from "../../shared/ui/native-button";
import { ListView } from "../../shared/components/list-view";
import { Component, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  PLAYLIST_SERVICE,
  PROFILE_SERVICE,
  SOCIAL_SERVICE,
} from "../../core/services/service-tokens";
import { Playlist, Profile } from "../../core/models/library";
import { PlaylistQuery } from "../../core/services/contracts/playlists";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { PlaylistCard } from "../../shared/components/playlist-card";
import { LibraryFilters } from "./library-filters";
@Component({
  selector: "app-library-page",
  imports: [
    ...UI_BUTTONS,
    ...UI_FIELDS,
    ListView,
    FormsModule,
    RouterLink,
    PageStatus,
    ActionFeedback,
    PlaylistCard,
    LibraryFilters,
  ],
  templateUrl: "./library-page.html",
})
export class LibraryPage {
  private readonly playlists = inject(PLAYLIST_SERVICE);
  private readonly profiles = inject(PROFILE_SERVICE);
  private readonly social = inject(SOCIAL_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly query = signal<PlaylistQuery>({ sort: "newest" });
  readonly filtersOpen = signal(false);
  readonly layout = signal<"cards" | "list">("cards");
  readonly page = new PageLoad<{
    playlists: Playlist[];
    profiles: Profile[];
    saved: string[];
  }>();
  readonly action = new ActionState();
  constructor() {
    effect(() => {
      const search = this.params().get("q") || "";
      this.query.update((q) => ({ ...q, search }));
    });
    effect(() => {
      const query = this.query();
      const view = this.routeData()["view"] as PlaylistQuery["view"];
      void this.load({ ...query, view });
    });
  }
  load(
    query: PlaylistQuery = {
      ...this.query(),
      view: this.routeData()["view"] as PlaylistQuery["view"],
    },
    retainData = false,
  ) {
    return this.page.run(async () => {
      const [playlists, profiles, saved] = await Promise.all([
        this.playlists.list(query),
        this.profiles.list(),
        this.social.savedIds(),
      ]);
      return { playlists, profiles, saved };
    }, retainData);
  }
  creator(id: string) {
    return this.page.data()?.profiles.find((p) => p.id === id);
  }
  clear() {
    this.query.set({ sort: "newest" });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: "merge",
    });
  }
  setSort(sort: PlaylistQuery["sort"]) {
    this.query.update((query) => ({ ...query, sort }));
  }
  save(playlist: Playlist) {
    const saved = this.page.data()?.saved.includes(playlist.id) || false;
    void this.action.run(async () => {
      await this.social.setSaved(playlist.id, !saved);
      await this.load(undefined, true);
    });
  }
}
