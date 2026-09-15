import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: "app-text-field",
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: ` <mat-form-field appearance="outline" subscriptSizing="dynamic">
    <mat-label>{{ label() }}</mat-label>
    @if (multiline()) {
      <textarea
        matInput
        [formControl]="control()"
        [rows]="rows()"
        [required]="required()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete()"
      ></textarea>
    } @else {
      <input
        matInput
        [formControl]="control()"
        [type]="type()"
        [required]="required()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete()"
      />
    }
    @if (hint()) {
      <mat-hint>{{ hint() }}</mat-hint>
    }
    <mat-error>{{ error() || validationMessage() }}</mat-error>
  </mat-form-field>`,
  styles: `
    :host,
    mat-form-field {
      display: block;
      width: 100%;
    }
  `,
})
export class AppTextField {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly type = input<
    "text" | "email" | "password" | "search" | "url" | "tel"
  >("text");
  readonly multiline = input(false);
  readonly rows = input(4);
  readonly hint = input("");
  readonly error = input("");
  readonly placeholder = input("");
  readonly autocomplete = input("off");
  required() {
    return this.control().hasValidator(Validators.required);
  }
  validationMessage() {
    const errors = this.control().errors;
    if (errors?.["required"]) return `${this.label()} is required.`;
    if (errors?.["email"]) return "Enter a valid email address.";
    if (errors?.["minlength"])
      return `Use at least ${errors["minlength"].requiredLength} characters.`;
    if (errors?.["maxlength"])
      return `Use no more than ${errors["maxlength"].requiredLength} characters.`;
    return `Check ${this.label().toLowerCase()}.`;
  }
}
