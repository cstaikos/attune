import { UI_FIELDS } from "../../shared/ui/field";
import { UI_BUTTONS } from "../../shared/ui/native-button";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AUTH_SERVICE } from "../../core/services/service-tokens";
import { safeReturnUrl } from "../../core/utils/return-url";
import { emailCallback } from "../../core/utils/auth-callback";
import { clearInvitation, pendingInvitation } from "../../core/utils/invite-link";
import { ActionState } from "../../shared/state/action-state";
import { ActionFeedback } from "../../shared/components/action-feedback";

@Component({
  selector: "app-account-page",
  imports: [
    ...UI_BUTTONS,
    ...UI_FIELDS,
    ReactiveFormsModule,
    RouterLink,
    ActionFeedback,
  ],
  templateUrl: "./account-page.html",
})
export class AccountPage {
  private readonly auth = inject(AUTH_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly mode: string = this.route.snapshot.data["mode"];
  readonly action = new ActionState();
  readonly ready = signal(false);
  readonly suspended = signal(false);
  readonly heading: Record<string, string> = {
    callback: "Checking your email link…",
    verify: "Check your email.",
    forgot: "Reset your password.",
    reset: "Choose a new password.",
    redeem: "Join the library.",
  };
  readonly form = inject(FormBuilder).nonNullable.group({
    email: [""],
    password: [""],
    confirmation: [""],
    username: [""],
    displayName: [""],
    practice: [""],
    inviteCode: [this.mode === "redeem" ? pendingInvitation() : ""],
  });
  constructor() {
    if (this.mode === "verify" || this.mode === "forgot")
      this.form.controls.email.setValidators([
        Validators.required,
        Validators.email,
      ]);
    if (this.mode === "reset") {
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(8),
      ]);
      this.form.controls.confirmation.setValidators([Validators.required]);
    }
    if (this.mode === "redeem") {
      this.form.controls.username.setValidators([
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{2,29}$/),
      ]);
      this.form.controls.practice.setValidators([
        Validators.required,
        Validators.maxLength(200),
      ]);
      this.form.controls.displayName.setValidators([Validators.maxLength(100)]);
      this.form.controls.inviteCode.setValidators([Validators.required]);
    }
    void this.action.run(async () => {
      if (this.mode === "callback") {
        const callback = emailCallback(new URL(window.location.href));
        // Remove one-use credentials from the address bar, including failed links.
        history.replaceState(history.state, "", "/auth/callback");
        if (callback.error)
          throw new Error(
            "This email link is invalid or expired. Request a new link below.",
          );
        await this.auth.completeCallback(callback.code, callback.tokens);
        await this.router.navigateByUrl(
          callback.recovery ? "/reset-password" : "/redeem",
          { replaceUrl: true },
        );
        return;
      }
      if (this.mode === "redeem" || this.mode === "reset") {
        const account = await this.auth.getAccess();
        if (!account)
          throw new Error("Sign in or open a valid email link to continue.");
        if (this.mode === "redeem") {
          if (account.membership === "active") {
            await this.router.navigateByUrl(this.destination);
            return;
          }
          if (account.membership === "suspended") {
            this.suspended.set(true);
            return;
          }
        }
      }
      this.ready.set(true);
    });
  }
  private get destination() {
    return safeReturnUrl(this.route.snapshot.queryParamMap.get("returnUrl"));
  }
  submit() {
    this.form.markAllAsTouched();
    if (!this.ready() || this.form.invalid) {
      this.action.error.set("Check the required fields and try again.");
      return;
    }
    const value = this.form.getRawValue();
    if (this.mode === "reset" && value.password !== value.confirmation) {
      this.action.error.set("Passwords do not match.");
      return;
    }
    void this.action.run(
      async () => {
        if (this.mode === "verify")
          await this.auth.resendVerification(value.email);
        if (this.mode === "forgot")
          await this.auth.requestPasswordReset(value.email);
        if (this.mode === "reset") {
          await this.auth.updatePassword(value.password);
          this.form.reset();
          this.ready.set(false);
        }
        if (this.mode === "redeem") {
        await this.auth.redeemInvitation(value);
        clearInvitation();
          this.form.controls.inviteCode.reset();
          await this.router.navigateByUrl(this.destination);
        }
      },
      this.mode === "reset"
        ? "Password updated. Sign in with your new password."
        : this.mode === "redeem"
          ? ""
          : "If this email is eligible, a link is on its way. Check your inbox and spam folder, and open it in this browser.",
    );
  }
  signOut() {
    void this.action.run(async () => {
      await this.auth.signOut();
      await this.router.navigateByUrl("/login");
    });
  }
}
