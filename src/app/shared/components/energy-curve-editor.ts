import { Component, input, output, signal } from "@angular/core";

@Component({
  selector: "app-energy-curve-editor",
  template: `
    <div class="curve-scroll">
      <div class="curve" [style.min-width.px]="values().length * 64">
        <div class="plot" #plot>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            @for (level of [0, 25, 50, 75, 100]; track level) {
              <line x1="0" x2="100" [attr.y1]="level" [attr.y2]="level" />
            }
            <polygon [attr.points]="'0,100 ' + line() + ' 100,100'" />
            <polyline [attr.points]="line()" />
          </svg>
          @for (value of values(); track $index; let i = $index) {
            @if (i < values().length - 1) {
              <button
                type="button"
                class="insert"
                [style.left.%]="x(i)"
                [style.width.%]="100 / (values().length - 1)"
                [disabled]="disabled() || values().length >= 12"
                [attr.aria-label]="'Insert point after point ' + (i + 1)"
                (click)="insert(i)"
              >
                <span>+</span>
              </button>
            }
            <div
              class="point"
              [class.dragging]="dragging() === i"
              [style.left.%]="x(i)"
              [style.top.%]="y(value)"
            >
              <div class="actions">
                <button
                  type="button"
                  [disabled]="disabled()"
                  [attr.aria-label]="'Edit label for point ' + (i + 1)"
                  (click)="editLabel(i)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5M4 15l5 5" />
                  </svg>
                </button>
                <button
                  type="button"
                  [disabled]="disabled() || values().length <= 2"
                  [attr.aria-label]="'Delete point ' + (i + 1)"
                  (click)="remove(i)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"
                    />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="handle"
                role="slider"
                aria-orientation="vertical"
                [attr.aria-label]="labels()[i] || 'Point ' + (i + 1)"
                aria-valuemin="1"
                aria-valuemax="5"
                [attr.aria-valuenow]="value"
                [attr.aria-valuetext]="'Energy ' + value + ' of 5'"
                [disabled]="disabled()"
                (pointerdown)="start($event, i)"
                (pointermove)="move($event, i, plot)"
                (pointerup)="end($event)"
                (pointercancel)="end($event)"
                (lostpointercapture)="dragging.set(null)"
                (keydown)="key($event, i)"
              >
                <span>{{ value }}</span>
              </button>
            </div>
          }
        </div>
        <div class="labels">
          @for (value of values(); track $index; let i = $index) {
            <span [style.left.%]="x(i)">{{ labels()[i] }}</span>
          }
        </div>
      </div>
    </div>
    @if (editing() !== null) {
      <div class="label-editor">
        <label
          >Point {{ editing()! + 1 }} label
          <input
            #labelInput
            [value]="draftLabel()"
            [disabled]="disabled()"
            (input)="draftLabel.set(labelInput.value)"
            (keydown.enter)="$event.preventDefault(); saveLabel()"
            (keydown.escape)="editing.set(null)"
          />
        </label>
        <button type="button" [disabled]="disabled()" (click)="saveLabel()">
          Save label
        </button>
        <button type="button" (click)="editing.set(null)">Cancel</button>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .curve-scroll {
      overflow-x: auto;
      padding: 0 4px;
    }
    .curve {
      padding: 54px 32px 12px;
    }
    .plot {
      position: relative;
      height: 190px;
    }
    .plot > svg {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    line {
      stroke: currentColor;
      opacity: 0.12;
      vector-effect: non-scaling-stroke;
    }
    polygon {
      fill: currentColor;
      opacity: 0.06;
    }
    polyline {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    button:disabled {
      cursor: default;
      opacity: 0.35;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }
    .insert {
      position: absolute;
      top: 0;
      height: 100%;
      border: 0;
      background: transparent;
    }
    .insert span {
      opacity: 0;
      display: inline-grid;
      place-items: center;
      border: 1px dashed currentColor;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      background: var(--surface, white);
    }
    .insert:hover:not(:disabled) span,
    .insert:focus-visible span {
      opacity: 1;
    }
    .point {
      position: absolute;
      transform: translate(-50%, -50%);
    }
    .point:hover,
    .point:focus-within,
    .point.dragging {
      z-index: 2;
    }
    .handle {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 2px solid currentColor;
      border-radius: 50%;
      background: var(--surface, white);
      touch-action: none;
      cursor: ns-resize;
    }
    .handle span {
      font-size: 12px;
    }
    .actions {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      padding-bottom: 5px;
      visibility: hidden;
    }
    .point:hover .actions,
    .point:focus-within .actions {
      visibility: visible;
    }
    .actions button {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      padding: 4px;
      border: 1px solid currentColor;
      background: var(--surface, white);
      border-radius: 6px;
    }
    .actions svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
    }
    .labels {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      margin-top: 24px;
      min-height: 42px;
    }
    .labels span {
      grid-area: 1 / 1;
      position: relative;
      transform: translateX(-50%);
      width: 60px;
      text-align: center;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .label-editor {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 8px;
      margin-top: 12px;
    }
    .label-editor label {
      display: grid;
      gap: 6px;
    }
    .label-editor input,
    .label-editor button {
      padding: 8px;
      border: 1px solid currentColor;
      border-radius: 6px;
      background: var(--surface, white);
      color: inherit;
    }
    @media (hover: none) {
      .actions {
        visibility: visible;
      }
      .insert span {
        opacity: 0.6;
      }
    }
  `,
})
export class EnergyCurveEditor {
  readonly values = input.required<readonly number[]>();
  readonly labels = input.required<readonly string[]>();
  readonly disabled = input(false);
  readonly valueChange = output<{ index: number; value: number }>();
  readonly insertPoint = output<{ index: number; value: number }>();
  readonly removePoint = output<number>();
  readonly labelChange = output<{ index: number; label: string }>();
  readonly dragging = signal<number | null>(null);
  readonly editing = signal<number | null>(null);
  readonly draftLabel = signal("");

  x(index: number) {
    return (index * 100) / (this.values().length - 1);
  }
  y(value: number) {
    return (5 - value) * 25;
  }
  line() {
    return this.values()
      .map((value, i) => `${this.x(i)},${this.y(value)}`)
      .join(" ");
  }
  between(index: number) {
    return Math.round((this.values()[index] + this.values()[index + 1]) / 2);
  }
  start(event: PointerEvent, index: number) {
    if (this.disabled() || event.button !== 0) return;
    this.dragging.set(index);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  move(event: PointerEvent, index: number, plot: HTMLElement) {
    if (this.disabled() || this.dragging() !== index) return;
    const bounds = plot.getBoundingClientRect();
    this.change(
      index,
      Math.round(5 - ((event.clientY - bounds.top) / bounds.height) * 4),
    );
  }
  end(event: PointerEvent) {
    this.dragging.set(null);
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId))
      target.releasePointerCapture(event.pointerId);
  }
  key(event: KeyboardEvent, index: number) {
    const value = this.values()[index];
    const next = (
      {
        ArrowUp: value + 1,
        ArrowRight: value + 1,
        ArrowDown: value - 1,
        ArrowLeft: value - 1,
        Home: 1,
        End: 5,
      } as Record<string, number>
    )[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.change(index, next);
  }
  private change(index: number, value: number) {
    value = Math.max(1, Math.min(5, value));
    if (!this.disabled() && value !== this.values()[index])
      this.valueChange.emit({ index, value });
  }
  editLabel(index: number) {
    this.draftLabel.set(this.labels()[index]);
    this.editing.set(index);
  }
  saveLabel() {
    const index = this.editing();
    if (index === null || this.disabled()) return;
    this.labelChange.emit({ index, label: this.draftLabel().trim() });
    this.editing.set(null);
  }
  insert(index: number) {
    this.editing.set(null);
    this.insertPoint.emit({ index: index + 1, value: this.between(index) });
  }
  remove(index: number) {
    this.editing.set(null);
    this.removePoint.emit(index);
  }
}
