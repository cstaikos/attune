import { Component, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-button",
  imports: [MatButtonModule],
  template: `<button
    [matButton]="
      variant() === 'primary'
        ? 'filled'
        : variant() === 'secondary'
          ? 'outlined'
          : 'text'
    "
    [type]="type()"
    [disabled]="disabled() || loading()"
    [attr.aria-busy]="loading()"
    [class.app-control-small]="size() === 'small'"
  >
    @if (loading()) {
      <span aria-hidden="true">Working… </span>
    }
    <ng-content />
  </button>`,
  styles: `
    :host {
      display: inline-block;
    }
    button {
      width: 100%;
    }
  `,
})
export class AppButton {
  readonly variant = input<"primary" | "secondary" | "text">("primary");
  readonly type = input<"button" | "submit" | "reset">("button");
  readonly size = input<"small" | "medium">("medium");
  readonly disabled = input(false);
  readonly loading = input(false);
}

@Component({
  selector: "app-icon-button",
  imports: [MatButtonModule],
  template: `<button
    matIconButton
    type="button"
    [attr.aria-label]="label()"
    [disabled]="disabled()"
  >
    <span aria-hidden="true"><ng-content /></span>
  </button>`,
})
export class AppIconButton {
  readonly label = input.required<string>();
  readonly disabled = input(false);
}
