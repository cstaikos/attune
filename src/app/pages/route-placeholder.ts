import { UI_BUTTONS } from "../shared/ui/native-button";
import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";

@Component({
  selector: "app-route-placeholder",
  imports: [...UI_BUTTONS, RouterLink],
  template: `
    <section class="empty-state" aria-labelledby="page-heading">
      <h2 id="page-heading">{{ data()["heading"] }}</h2>
      @if (data()["notFound"]) {
        <p>This address does not match a page.</p>
      } @else {
        <p>
          This screen is being prepared. The library will be available soon.
        </p>
      }
      <a matButton appButton="secondary" routerLink="/library"
        >Back to library</a
      >
    </section>
  `,
})
export class RoutePlaceholder {
  private readonly route = inject(ActivatedRoute);
  protected readonly data = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
}
