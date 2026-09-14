import { LeaveDialog } from "./shared/components/leave-dialog";
import { Component, effect, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import { MemberSession } from "./core/auth/member-session";
import { AUTH_SERVICE } from "./core/services/service-tokens";
import { ActionState } from "./shared/state/action-state";
import { ActionFeedback } from "./shared/components/action-feedback";
@Component({
  selector: "app-root",
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ActionFeedback,
    LeaveDialog,
  ],
  templateUrl: "./app.html",
})
export class App {
  readonly member = inject(MemberSession);
  readonly action = new ActionState();
  private readonly auth = inject(AUTH_SERVICE);
  private readonly router = inject(Router);
  private hadSession = false;
  search = "";
  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  constructor() {
    effect(() => {
      this.search =
        this.router.parseUrl(this.navigation()).queryParams["q"] || "";
    });
    effect(() => {
      const signedIn = !!this.member.session();
      if (
        this.hadSession &&
        !signedIn &&
        !/^\/(login|join|redeem|verify-email|forgot-password|reset-password|auth)(?:[/?#]|$)/.test(
          this.router.url,
        )
      )
        void this.router.navigate(["/login"], {
          queryParams: { returnUrl: this.router.url },
        });
      this.hadSession = signedIn;
    });
  }
  searchLibrary() {
    void this.router.navigate(["/library"], {
      queryParams: { q: this.search || null },
    });
  }
  signOut() {
    void this.action.run(async () => {
      if (await this.router.navigateByUrl("/login")) await this.auth.signOut();
    });
  }
}
