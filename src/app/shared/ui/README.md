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
