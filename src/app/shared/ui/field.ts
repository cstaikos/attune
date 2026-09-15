import { Directive, contentChild, inject, input } from "@angular/core";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";

/** Shared policy on a native Material field; preserves both Angular forms APIs. */
@Directive({
  selector: "mat-form-field[appField]",
  exportAs: "appField",
  host: { class: "app-ui-field" },
})
export class AppField {
  readonly label = input.required<string>({ alias: "appField" });
  readonly error = input("");
  private readonly field = contentChild(MatInput);
  constructor() {
    const field = inject(MatFormField);
    field.appearance = "outline";
    field.subscriptSizing = "dynamic";
  }
  validationMessage() {
    if (this.error()) return this.error();
    const errors = this.field()?.ngControl?.errors;
    if (errors?.["required"]) return `${this.label()} is required.`;
    if (errors?.["email"]) return "Enter a valid email address.";
    if (errors?.["minlength"]) return `Use at least ${errors["minlength"].requiredLength} characters.`;
    if (errors?.["maxlength"]) return `Use no more than ${errors["maxlength"].requiredLength} characters.`;
    if (errors?.["min"]) return `Enter ${errors["min"].min} or more.`;
    if (errors?.["max"]) return `Enter ${errors["max"].max} or less.`;
    return `Check ${this.label().toLowerCase()}.`;
  }
}
export const UI_FIELDS = [AppField, MatFormFieldModule, MatInput] as const;
