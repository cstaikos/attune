# Shared UI

Material-backed standalone controls. Import only the components a page uses.
Styles live in `src/theme.scss`; use Material's public theme/override mixins.
The interactive reference is `/ui-showcase`.

- `AppButton`: `variant` (primary/secondary/text), `size` (small/medium), `type`, `disabled`, `loading`. Defaults to `type="button"`; use `type="submit"` inside a form. The native button remains inside the wrapper.
- `AppIconButton`: required accessible `label`, optional `disabled`; project an SVG or text icon without requiring an icon font.
- `AppTextField`: required `label` and non-nullable string `control`; optional `type`, `autocomplete`, `hint`, `error`, `placeholder`. Set `multiline` for a textarea and `rows` for its height.
- `AppSelect`: required `label`, string `control`, and `options` with unique string values; optional `hint` and `error`.
- `AppCheckbox` / `AppToggle`: required `label` and non-nullable boolean `control`.

Pass the existing FormControl via `[control]="form.controls.email"`. Do not add
`formControlName` to these wrappers: their inner Material control binds directly
to the supplied control, preserving validators, values, touched/dirty state,
and programmatic resets. Disable fields through `control.disable()` and enable
through `control.enable()`. Text fields and selects derive required state from
`Validators.required`; Material shows errors when invalid and touched or submitted.
Use `error` to supply a domain-specific message for those fields.

Keep business actions in pages and services. Add wrapper options only when an
app use case needs them; do not forward the entire Material API.

## Existing forms and native actions

Use `UI_BUTTONS` for native buttons and router/external links. The shared
`appButton` directive configures Material while keeping click events, focus,
ARIA attributes, disabled state, and form submission on the native element.
Buttons default to `type="button"`; submit actions must specify `type="submit"`.
Variants are `primary`, `secondary`, `text`, and `chip`. Use `tone="danger"` for
destructive actions and `aria-pressed` for selection state.

```html
<button matButton appButton="primary" type="submit" [disabled]="action.busy()">
  Save
</button>
<a matButton appButton="secondary" routerLink="/library">Cancel</a>
```

Use `UI_FIELDS` for existing reactive or template-driven forms. Keep the native
control directly inside the Material field so Material can discover it and wire
labels, hints, and errors. The `appField` directive owns appearance and validation
messages; page templates own labels, validators, and bindings. Inputs and textareas
use `matInput`; native selects use `matNativeControl`.

```html
<mat-form-field appField="Title" #titleField="appField">
  <mat-label>Title</mat-label>
  <input matInput formControlName="title" required />
  <mat-error>{{ titleField.validationMessage() }}</mat-error>
</mat-form-field>
```

`AppSlider` accepts a numeric `control`, accessible `label`, `min`, `max`, `step`,
and optional `disabled`. `AppCheckbox` also supports `[checked]` and
`(checkedChange)` for query/filter state without allocating a FormControl.

## UI preview

Run `pnpm exec ng serve --configuration ui-preview --port 4202` for an isolated
sample-data preview with a seeded administrator. All data stays in memory and
resets on reload. This configuration never connects to Supabase; production and
local Supabase configurations continue to use their existing providers.
