import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { safeReturnUrl } from "../core/utils/return-url";
import { FeedbackButton } from "../shared/components/feedback-button";
import { UI_BUTTONS } from "../shared/ui/native-button";

@Component({
  imports: [...UI_BUTTONS, RouterLink, FeedbackButton],
  template: `
    <section class="auth-page">
      <h2>We couldn't connect.</h2>
      <p role="alert">
        The service may be temporarily unavailable, or your connection may have
        dropped. Check your connection and try again.
      </p>
      <a matButton appButton="primary" [routerLink]="destination">Try again</a>
      <app-feedback-button [problem]="true" />
    </section>
  `,
})
export class UnavailablePage {
  readonly destination = safeReturnUrl(
    inject(ActivatedRoute).snapshot.queryParamMap.get("returnUrl"),
  );
}
