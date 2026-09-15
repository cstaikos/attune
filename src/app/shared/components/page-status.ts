import { UI_BUTTONS } from "../ui/native-button";
import { Component, input, output } from "@angular/core";
@Component({
  imports: [...UI_BUTTONS],
  selector: "app-page-status",
  template: `
    @if (loading()) {
      <p class="page-status" role="status">Loading…</p>
    }
    @if (error()) {
      <div class="page-status">
        <p role="alert">{{ error() }}</p>
        <button matButton appButton="secondary" (click)="retry.emit()">
          Try again
        </button>
      </div>
    }
  `,
})
export class PageStatus {
  readonly loading = input(false);
  readonly error = input("");
  readonly retry = output<void>();
}
