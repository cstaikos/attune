import type { ValidatorFn } from "@angular/forms" with { "resolution-mode": "import" };
import { parsePlaylistLink } from "./playlist-link";

export const nonBlank: ValidatorFn = (control) =>
  typeof control.value === "string" && control.value.trim()
    ? null
    : { required: true };

export const wholeNumber: ValidatorFn = (control) =>
  Number.isSafeInteger(control.value) ? null : { wholeNumber: true };

export const playlistUrl: ValidatorFn = (control) =>
  !control.value?.trim() || parsePlaylistLink(control.value)
    ? null
    : { playlistUrl: true };

export const requiredLink: ValidatorFn = (control) =>
  control.value.some((url: string) => url.trim()) ? null : { required: true };

export const positiveDuration: ValidatorFn = (control) => {
  const { hours, minutes } = control.value;
  const total = hours * 60 + minutes;
  return Number.isSafeInteger(total) && total > 0 ? null : { duration: true };
};
