import { Component, input } from "@angular/core";
@Component({
  selector: "app-action-feedback",
  template: `
    @if (error()) {
      <p class="form-error" role="alert">{{ error() }}</p>
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
