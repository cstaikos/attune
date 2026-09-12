import { inject } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { ConfirmNavigation } from "../../shared/state/confirm-navigation";

export const editorLeaveGuard: CanDeactivateFn<{
  readonly form: { readonly dirty: boolean };
}> = (page) =>
  !page.form.dirty ||
  inject(ConfirmNavigation).ask("Your playlist changes have not been saved.");
