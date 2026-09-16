import { Component, computed, input } from "@angular/core";
@Component({
  selector: "app-energy-chart",
  template: `
    <figure class="energy-chart" [class.mini-chart]="mini()">
      <svg
        [attr.viewBox]="mini() ? '0 0 260 68' : '0 0 720 190'"
        role="img"
        [attr.aria-label]="
          'Energy curve from start to finish: ' + values().join(', ')
        "
      >
        <g class="chart-grid">
          @for (y of grid(); track y) {
            <line
              [attr.x1]="pad()"
              [attr.x2]="width() - pad()"
              [attr.y1]="y"
              [attr.y2]="y"
            />
          }
        </g>
        <polygon class="chart-area" [attr.points]="area()" />
        <polyline class="chart-line" [attr.points]="line()" />
        @if (!mini()) {
          <g class="chart-dots">
            @for (point of points(); track $index) {
              <circle [attr.cx]="point.x" [attr.cy]="point.y" r="4" />
            }
          </g>
        }
      </svg>
      @if (!mini()) {
        <figcaption [class.point-labels]="hasLabels()">
          @if (hasLabels()) {
            @for (point of points(); track $index) {
              <span
                [style.left.%]="point.x / width() * 100"
                [style.width.%]="100 / points().length"
              >{{point.label}}</span>
            }
          } @else {
            <span>Start</span><span>Middle</span><span>Finish</span>
          }
        </figcaption>
      }
    </figure>
  `,
  styles: `
    figcaption { display: flex; }
    figcaption span { flex: 1; min-width: 0; text-align: center; overflow-wrap: anywhere; }
    figcaption span:first-child { text-align: left; }
    figcaption span:last-child { text-align: right; }
    figcaption.point-labels { display: grid; grid-template-columns: minmax(0, 1fr); }
    figcaption.point-labels span {
      grid-area: 1 / 1;
      position: relative;
      transform: translateX(-50%);
      text-align: center;
    }
  `,
})
export class EnergyChart {
  readonly values = input.required<readonly number[]>();
  readonly labels = input<readonly string[] | undefined>();
  readonly hasLabels = computed(() => this.labels()?.some((label) => label.trim()) ?? false);
  readonly mini = input(false);
  readonly width = computed(() => (this.mini() ? 260 : 720));
  readonly height = computed(() => (this.mini() ? 68 : 190));
  readonly pad = computed(() => (this.mini() ? 8 : 24));
  readonly grid = computed(() => [1, 2, 3, 4, 5].map((n) => this.y(n)));
  readonly points = computed(() =>
    this.values().map((n, i, a) => ({
      x:
        this.pad() +
        (i / Math.max(1, a.length - 1)) * (this.width() - 2 * this.pad()),
      y: this.y(n),
      label: this.labels()?.[i] ?? (i === 0 ? "start" : i === a.length - 1 ? "finish" : ""),
    })),
  );
  readonly line = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(" "),
  );
  readonly area = computed(
    () =>
      `${this.pad()},${this.height() - this.pad()} ${this.line()} ${this.width() - this.pad()},${this.height() - this.pad()}`,
  );
  private y(n: number) {
    return this.pad() + ((5 - n) / 4) * (this.height() - 2 * this.pad());
  }
}
