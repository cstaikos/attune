import { Component, viewChild } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AppButton, AppIconButton } from "../../shared/ui/button";
import { AppTextField } from "../../shared/ui/text-field";
import { AppSelect } from "../../shared/ui/select";
import { AppCheckbox, AppToggle } from "../../shared/ui/boolean-controls";

@Component({
  selector: "app-ui-showcase-page",
  imports: [
    ReactiveFormsModule,
    AppButton,
    AppIconButton,
    AppTextField,
    AppSelect,
    AppCheckbox,
    AppToggle,
  ],
  template: ` <section class="showcase">
    <p class="eyebrow">Attune design system</p>
    <h1>Common components</h1>
    <p>Shared colors, comfortable controls, and consistent feedback.</p>
    <h2>Buttons</h2>
    <div class="button-row">
      <app-button (click)="message = 'Primary action selected.'"
        >Primary</app-button
      >
      <app-button variant="secondary">Secondary</app-button>
      <app-button variant="text">Text action</app-button>
      <app-button size="small">Small</app-button>
      <app-button [disabled]="true">Disabled</app-button>
      <app-button [loading]="true">Save changes</app-button>
      <app-icon-button
        label="Add playlist"
        (click)="message = 'Add playlist selected.'"
        >＋</app-icon-button
      >
      <app-icon-button label="Add playlist unavailable" [disabled]="true"
        >＋</app-icon-button
      >
    </div>
    <p role="status">{{ message }}</p>
    <h2>Form controls</h2>
    <form [formGroup]="form" (ngSubmit)="validate()">
      <app-text-field
        label="Playlist title"
        [control]="form.controls.title"
        hint="A short, memorable name."
      />
      <app-text-field
        label="Email"
        type="email"
        [control]="form.controls.email"
        autocomplete="email"
      />
      <app-text-field
        label="Description"
        [control]="form.controls.description"
        [multiline]="true"
      />
      <app-select
        label="Session stage"
        [control]="form.controls.stage"
        [options]="stages"
        hint="Choose the intended stage."
      />
      <app-text-field label="Disabled field" [control]="disabledText" />
      <app-select
        label="Disabled select"
        [control]="disabledSelect"
        [options]="stages"
      />
      <app-checkbox label="Save to my library" [control]="form.controls.save" />
      <app-toggle label="Allow comments" [control]="form.controls.comments" />
      <app-checkbox label="Disabled checkbox" [control]="disabledBoolean" />
      <app-toggle label="Disabled toggle" [control]="disabledBoolean" />
      <div class="button-row">
        <app-button type="submit">Validate form</app-button>
        <app-button variant="secondary" (click)="reset()">Reset</app-button>
      </div>
    </form>
  </section>`,
  styles: `
    :host {
      display: block;
    }
    .showcase {
      max-width: 900px;
      margin: auto;
      padding: 32px 24px 64px;
    }
    h1 {
      font:
        400 2.5rem/1.2 Georgia,
        serif;
    }
    h2 {
      margin-top: 32px;
    }
    .button-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--app-space-md);
    }
    form {
      display: grid;
      gap: var(--app-space-lg);
      max-width: 520px;
    }
  `,
})
export class UiShowcasePage {
  private readonly formDirective = viewChild.required(FormGroupDirective);
  message = "";
  readonly stages = [
    { value: "opening", label: "Opening" },
    { value: "exploration", label: "Exploration" },
    { value: "closing", label: "Closing" },
  ];
  readonly form = new FormGroup({
    title: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    description: new FormControl("", { nonNullable: true }),
    stage: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    save: new FormControl(false, { nonNullable: true }),
    comments: new FormControl(true, { nonNullable: true }),
  });
  readonly disabledText = new FormControl(
    { value: "Read only while saving", disabled: true },
    { nonNullable: true },
  );
  readonly disabledSelect = new FormControl(
    { value: "opening", disabled: true },
    { nonNullable: true },
  );
  readonly disabledBoolean = new FormControl(
    { value: true, disabled: true },
    { nonNullable: true },
  );
  validate() {
    this.form.markAllAsTouched();
    this.message = this.form.valid
      ? "All fields are valid."
      : "Review the highlighted fields.";
  }
  reset() {
    this.formDirective().resetForm();
    this.message = "Form reset.";
  }
}
