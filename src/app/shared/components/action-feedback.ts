import { Component, input } from "@angular/core";
import { FeedbackButton } from "./feedback-button";
@Component({
  selector: "app-action-feedback",
  imports: [FeedbackButton],
  template: `
    @if (error()) {
      <p class="form-error" role="alert">{{ error() }}</p>
      <app-feedback-button [problem]="true" />
    }
    @if (message()) {
      <p class="success-message" role="status">{{ message() }}</p>
    }
  `,
})
export class ActionFeedback {
  readonly error = input("");
  readonly message = input("");
}
