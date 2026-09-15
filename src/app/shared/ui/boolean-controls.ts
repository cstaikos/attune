import { Component, input, output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

@Component({
  selector: "app-checkbox",
  imports: [ReactiveFormsModule, MatCheckboxModule],
  template: `@if (control(); as formControl) {
      <mat-checkbox [formControl]="formControl">{{ label() }}</mat-checkbox>
    } @else {
      <mat-checkbox
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="checkedChange.emit($event.checked)"
        >{{ label() }}</mat-checkbox
      >
    }`,
})
export class AppCheckbox {
  readonly control = input<FormControl<boolean>>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly checkedChange = output<boolean>();
  readonly label = input.required<string>();
}

@Component({
  selector: "app-toggle",
  imports: [ReactiveFormsModule, MatSlideToggleModule],
  template: `<mat-slide-toggle [formControl]="control()">{{
    label()
  }}</mat-slide-toggle>`,
})
export class AppToggle {
  readonly control = input.required<FormControl<boolean>>();
  readonly label = input.required<string>();
}
