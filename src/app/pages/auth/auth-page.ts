import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AUTH_SERVICE } from "../../core/services/service-tokens";
import { safeReturnUrl } from "../../core/utils/return-url";
import { pendingInvitation, rememberInvitation } from "../../core/utils/invite-link";
import { ActionState } from "../../shared/state/action-state";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { AppButton } from "../../shared/ui/button";
import { AppTextField } from "../../shared/ui/text-field";
@Component({
  selector: "app-auth-page",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ActionFeedback,
    AppButton,
    AppTextField,
  ],
  templateUrl: "./auth-page.html",
})
export class AuthPage {
  private readonly auth = inject(AUTH_SERVICE);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  readonly joining = computed(() => this.data()["joining"] === true);
  readonly destination = safeReturnUrl(
    this.route.snapshot.queryParamMap.get("returnUrl"),
  );
  readonly action = new ActionState();
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    username: [""],
    displayName: [""],
    practice: [""],
    inviteCode: [this.route.snapshot.queryParamMap.get("invite") || pendingInvitation()],
  });
  constructor() {
    const invite = this.route.snapshot.queryParamMap.get("invite");
    if (invite) {
      rememberInvitation(invite);
      this.form.controls.inviteCode.disable();
    }
    if (this.route.snapshot.queryParamMap.has("unavailable"))
      this.action.error.set(
        "Unable to check your account. Check your connection and try signing in again.",
      );
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.joining() && !this.form.controls.inviteCode.value.trim()) {
      this.action.error.set("You need an invitation to join. Open your invite link or enter your code.");
      return;
    }
    if (this.form.invalid) {
      this.action.error.set(
        "Enter a valid email and a password of at least 8 characters.",
      );
      return;
    }
    void this.action.run(async () => {
      const value = this.form.getRawValue();
      if (this.joining()) {
        rememberInvitation(value.inviteCode.trim());
        await this.auth.signUp(value);
        this.form.controls.password.reset();
        await this.router.navigate(["/verify-email"]);
      } else {
        const session = await this.auth.signIn(value);
        this.form.controls.password.reset();
        await this.router.navigateByUrl(
          session.membership && session.membership !== "active"
            ? "/redeem"
            : this.destination,
        );
      }
    });
  }
}
