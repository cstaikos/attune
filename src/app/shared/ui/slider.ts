import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatSliderModule } from "@angular/material/slider";

@Component({
  selector: "app-slider",
  imports: [ReactiveFormsModule, MatSliderModule],
  template: `
    <span class="slider-label">{{ label() }} · {{ control().value }}</span>
    <mat-slider
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [disabled]="disabled() || control().disabled"
      discrete
    >
      <input
        matSliderThumb
        [formControl]="control()"
        [attr.aria-label]="label()"
      />
    </mat-slider>
  `,
  styles: `
    :host {
      display: grid;
      min-width: 0;
    }
    mat-slider {
      margin: 0 12px;
    }
    .slider-label {
      font-size: 0.875rem;
      color: var(--muted);
    }
  `,
})
export class AppSlider {
  readonly control = input.required<FormControl<number>>();
  readonly label = input.required<string>();
  readonly min = input(1);
  readonly max = input(5);
  readonly step = input(1);
  readonly disabled = input(false);
}
