import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
@Component({
  selector: "app-select",
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  template: `<mat-form-field appearance="outline" subscriptSizing="dynamic">
    <mat-label>{{ label() }}</mat-label>
    <mat-select [formControl]="control()" [required]="required()">
      @for (option of options(); track option.value) {
        <mat-option
          [value]="option.value"
          [disabled]="option.disabled ?? false"
          >{{ option.label }}</mat-option
        >
      }
    </mat-select>
    @if (hint()) {
      <mat-hint>{{ hint() }}</mat-hint>
    }
    <mat-error>{{
      error() ||
        (control().hasError("required")
          ? label() + " is required."
          : "Choose a valid option.")
    }}</mat-error>
  </mat-form-field>`,
  styles: `
    :host,
    mat-form-field {
      display: block;
      width: 100%;
    }
  `,
})
export class AppSelect {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly hint = input("");
  readonly error = input("");
  required() {
    return this.control().hasValidator(Validators.required);
  }
}
