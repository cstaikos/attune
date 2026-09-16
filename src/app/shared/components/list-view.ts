import { UI_FIELDS } from "../ui/field";
import { UI_BUTTONS } from "../ui/native-button";
import {
  Component,
  computed,
  contentChild,
  input,
  linkedSignal,
  signal,
  TemplateRef,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { pageWindow } from "../../core/utils/pagination";

export interface ListFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}
@Component({
  selector: "app-list-view",
  imports: [...UI_BUTTONS, ...UI_FIELDS, NgTemplateOutlet, FormsModule],
  template: `
    <div class="list-controls">
      @if (searchable()) {
        <mat-form-field
          class="list-search"
          appField="Search {{ label().toLowerCase() }}"
          #field1="appField"
          ><mat-label>Search {{ label().toLowerCase() }}</mat-label
          ><input
            matInput
            type="search"
            [ngModel]="search()"
            (ngModelChange)="search.set($event); current.set(1)"
            placeholder="Search…"
          />
          <mat-error>{{
            field1.validationMessage()
          }}</mat-error></mat-form-field
        >
      }
      @for (filter of filters(); track filter.key) {
        <mat-form-field appField="{{ filter.label }}" #field2="appField"
          ><mat-label>{{ filter.label }}</mat-label
          ><select
            matNativeControl
            [ngModel]="selected()[filter.key] || ''"
            (ngModelChange)="setFilter(filter.key, $event)"
          >
            <option value="">All {{ filter.label.toLowerCase() }}</option>
            @for (option of filter.options; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
          <mat-error>{{
            field2.validationMessage()
          }}</mat-error></mat-form-field
        >
      }
      @if (search() || hasFilters()) {
        <button matButton appButton="text" type="button" (click)="clear()">
          Clear filters
        </button>
      }
    </div>
    <div [class]="layout()">
      @for (item of visible(); track itemKey()(item)) {
        <ng-container
          [ngTemplateOutlet]="template() || null"
          [ngTemplateOutletContext]="{ $implicit: item }"
        />
      } @empty {
        <p class="empty-state">
          {{
            search() || hasFilters()
              ? "No matches. Try another search or clear the filters."
              : emptyMessage()
          }}
        </p>
      }
    </div>
    <nav class="pagination" [attr.aria-label]="label() + ' pagination'">
      <span role="status"
        >{{ window().start }}–{{ window().end }} of {{ filtered().length }}
        {{ label().toLowerCase() }}</span
      >
      <mat-form-field appField="Per page" #field3="appField"
        ><mat-label>Per page</mat-label
        ><select
          matNativeControl
          [ngModel]="size()"
          (ngModelChange)="size.set(+$event); current.set(1)"
        >
          <option [ngValue]="12">12</option>
          <option [ngValue]="24">24</option>
          <option [ngValue]="48">48</option>
        </select>
        <mat-error>{{ field3.validationMessage() }}</mat-error></mat-form-field
      >
      <div class="page-buttons">
        <button
          matButton
          appButton="secondary"
          type="button"
          [disabled]="window().page === 1"
          (click)="current.set(window().page - 1)"
          [attr.aria-label]="'Previous page of ' + label().toLowerCase()"
        >
          Previous
        </button>
        <span>Page {{ window().page }} of {{ window().pages }}</span>
        <button
          matButton
          appButton="secondary"
          type="button"
          [disabled]="window().page === window().pages"
          (click)="current.set(window().page + 1)"
          [attr.aria-label]="'Next page of ' + label().toLowerCase()"
        >
          Next
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .list-controls,
      .pagination,
      .page-buttons {
        display: flex;
        align-items: end;
        flex-wrap: wrap;
        gap: 12px;
      }
      .list-controls {
        margin: 16px 0;
      }
      .list-controls:empty {
        display: none;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--muted);
      }
      .list-search {
        flex: 1;
        min-width: 180px;
      }

      .pagination {
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid var(--line);
        padding: 16px 0;
        margin-top: 20px;
        font-size: 0.85rem;
        color: var(--muted);
      }
      .pagination .app-ui-field {
        width: 110px;
      }
      .page-buttons {
        align-items: center;
      }
      @media (max-width: 600px) {
        .pagination {
          justify-content: center;
        }
        .page-buttons {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class ListView<T> {
  readonly items = input<readonly T[]>([]);
  readonly label = input("Items");
  readonly layout = input("");
  readonly emptyMessage = input("Nothing here yet.");
  readonly searchable = input(true);
  readonly filters = input<ListFilter[]>([]);
  readonly searchText = input<(item: T) => string>((item) =>
    JSON.stringify(item),
  );
  readonly itemKey = input<(item: T) => unknown>(
    (item) => (item as { id?: string }).id ?? item,
  );
  readonly resetKey = input<unknown>();
  readonly template = contentChild<TemplateRef<{ $implicit: T }>>(TemplateRef);
  readonly search = signal("");
  readonly selected = signal<Record<string, string>>({});
  readonly size = signal(12);
  readonly current = linkedSignal(() => {
    this.resetKey();
    return 1;
  });
  readonly hasFilters = computed(() =>
    Object.values(this.selected()).some(Boolean),
  );
  readonly filtered = computed(() =>
    this.items().filter(
      (item) =>
        this.searchText()(item)
          .toLocaleLowerCase()
          .includes(this.search().trim().toLocaleLowerCase()) &&
        this.filters().every(
          (filter) =>
            !this.selected()[filter.key] ||
            String((item as Record<string, unknown>)[filter.key]) ===
              this.selected()[filter.key],
        ),
    ),
  );
  readonly window = computed(() =>
    pageWindow(this.filtered().length, this.current(), this.size()),
  );
  readonly visible = computed(() =>
    this.filtered().slice(this.window().offset, this.window().end),
  );
  setFilter(key: string, value: string) {
    this.selected.update((filters) => ({ ...filters, [key]: value }));
    this.current.set(1);
  }
  clear() {
    this.search.set("");
    this.selected.set({});
    this.current.set(1);
  }
}
