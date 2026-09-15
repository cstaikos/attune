import { Directive, ElementRef, effect, inject, input } from "@angular/core";
import { MatButton } from "@angular/material/button";

/** Keeps native link/form semantics and attributes on the interactive element. */
@Directive({
  selector: "button[appButton][matButton], a[appButton][matButton]",
  host: {
    class: "app-ui-button",
    "[class.app-control-small]": "size() === 'small'",
    "[class.app-control-danger]": "tone() === 'danger'",
    "[class.app-control-chip]": "variant() === 'chip'",
  },
})
export class AppNativeButton {
  readonly variant = input<"primary" | "secondary" | "text" | "chip">(
    "primary",
    { alias: "appButton" },
  );
  readonly size = input<"small" | "medium">("medium");
  readonly tone = input<"default" | "danger">("default");
  private readonly material = inject(MatButton);
  constructor() {
    const element =
      inject<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(
        ElementRef,
      ).nativeElement;
    if (element.tagName === "BUTTON" && !element.hasAttribute("type"))
      element.setAttribute("type", "button");
    effect(() => {
      this.material.appearance =
        this.variant() === "primary"
          ? "filled"
          : this.variant() === "text"
            ? "text"
            : "outlined";
    });
  }
}
export const UI_BUTTONS = [MatButton, AppNativeButton] as const;
