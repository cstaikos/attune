import { UI_BUTTONS } from "./shared/ui/native-button";
import { LeaveDialog } from "./shared/components/leave-dialog";
import { Component, effect, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import {
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  NavigationSkipped,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { MemberSession } from "./core/auth/member-session";
import { MODERATION_SERVICE } from "./core/services/service-tokens";
import { signal } from "@angular/core";
import { AUTH_SERVICE } from "./core/services/service-tokens";
import { ActionState } from "./shared/state/action-state";
import { ActionFeedback } from "./shared/components/action-feedback";
import { FeedbackButton } from "./shared/components/feedback-button";
@Component({
  selector: "app-root",
  imports: [
    ...UI_BUTTONS,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ActionFeedback,
    LeaveDialog,
    FeedbackButton,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./app.html",
})
export class App {
  readonly isAdmin = signal(false);
  private readonly moderation = inject(MODERATION_SERVICE);
  readonly member = inject(MemberSession);
  readonly action = new ActionState();
  private readonly auth = inject(AUTH_SERVICE);
  private readonly router = inject(Router);
  readonly navigating = toSignal(
    this.router.events.pipe(
      filter(
        (event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped,
      ),
      map((event) => event instanceof NavigationStart),
    ),
    { initialValue: true },
  );
  private hadSession = false;
  constructor() {
    effect(() => {
      const signedIn = !!this.member.session();
      this.isAdmin.set(false);
      if (signedIn)
        void this.moderation
          .isAdmin()
          .then((value) => this.isAdmin.set(value))
          .catch(() => this.isAdmin.set(false));
      if (
        this.hadSession &&
        !signedIn &&
        !this.navigating() &&
        !/^\/(login|join|redeem|verify-email|forgot-password|reset-password|auth|unavailable)(?:[/?#]|$)/.test(
          this.router.url,
        )
      )
        void this.router.navigate(["/login"], {
          queryParams: { returnUrl: this.router.url },
        });
      this.hadSession = signedIn;
    });
  }
  signOut() {
    void this.action.run(async () => {
      if (await this.router.navigateByUrl("/login")) await this.auth.signOut();
    });
  }
}
