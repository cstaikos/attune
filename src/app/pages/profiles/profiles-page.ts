import { ListView } from "../../shared/components/list-view";
import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PROFILE_SERVICE } from "../../core/services/service-tokens";
import { Profile } from "../../core/models/library";
import { PageLoad } from "../../shared/state/page-load";
import { PageStatus } from "../../shared/components/page-status";
@Component({
  selector: "app-profiles-page",
  imports: [ListView, RouterLink, PageStatus],
  template: `
    <section class="profiles-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">The community</p>
          <h2>Practitioners</h2>
        </div>
      </div>
      <app-page-status
        [loading]="page.loading()"
        [error]="page.error()"
        (retry)="load()"
      />
      <app-list-view
        [items]="page.data() || []"
        label="Practitioners"
        layout="profile-grid"
        [filters]="filters()"
        emptyMessage="No practitioners found."
      >
        <ng-template let-profile>
          <article class="user-card">
            <a class="user-card-main" [routerLink]="['/profile', profile.id]"
              ><div class="avatar profile-avatar">{{ profile.initials }}</div>
              <div>
                <p class="eyebrow">{{ profile.username }}</p>
                <h3>{{ profile.displayName || profile.username }}</h3>
                <p class="meta-line">
                  {{ profile.practice }}
                  {{ profile.location ? "· " + profile.location : "" }}
                </p>
              </div></a
            >
            <p>{{ profile.bio || "No bio yet." }}</p>
          </article>
        </ng-template>
      </app-list-view>
    </section>
  `,
})
export class ProfilesPage {
  private readonly profiles = inject(PROFILE_SERVICE);
  readonly page = new PageLoad<Profile[]>();
  readonly filters = computed(() =>
    ["practice", "location"].map((key) => ({
      key,
      label: key === "practice" ? "Practice" : "Location",
      options: [
        ...new Set(
          (this.page.data() || [])
            .map((p) => p[key as "practice" | "location"])
            .filter(Boolean),
        ),
      ]
        .sort()
        .map((value) => ({ value, label: value })),
    })),
  );
  constructor() {
    void this.load();
  }
  load() {
    return this.page.run(() => this.profiles.list());
  }
}
