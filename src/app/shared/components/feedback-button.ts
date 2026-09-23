import { Component, Injectable, inject, input, signal } from "@angular/core";
import * as Sentry from "@sentry/angular";
import { UI_BUTTONS } from "../ui/native-button";

@Injectable({ providedIn: "root" })
class FeedbackForm {
  readonly busy = signal(false);
  private removeForm?: () => void;

  async open(problem: boolean): Promise<void> {
    const feedback = Sentry.getFeedback();
    if (!feedback || this.busy()) return;
    this.busy.set(true);
    this.removeForm?.();
    const trigger = document.activeElement;
    const restoreFocus = () => {
      this.busy.set(false);
      setTimeout(() => {
        if (trigger instanceof HTMLElement && trigger.isConnected)
          trigger.focus();
      });
    };
    try {
      const form = await feedback.createForm({
        formTitle: problem ? "Report this problem" : "Send feedback",
        tags: { feedback_source: problem ? "error" : "footer" },
        onSubmitSuccess: restoreFocus,
        onFormClose: () => {
          form.removeFromDom();
          restoreFocus();
        },
      });
      this.removeForm = () => form.removeFromDom();
      form.appendToDom();
      form.open();
    } catch (error) {
      this.busy.set(false);
      throw error;
    }
  }
}

@Component({
  selector: "app-feedback-button",
  imports: [...UI_BUTTONS],
  template: `
    @if (available) {
      <button
        matButton
        appButton="text"
        size="small"
        [disabled]="form.busy()"
        (click)="open()"
      >
        {{ problem() ? "Report this problem" : "Send feedback" }}
      </button>
      @if (failed()) {
        <p class="form-error" role="alert">
          Feedback couldn't open. Please try again.
        </p>
      }
    }
  `,
})
export class FeedbackButton {
  readonly problem = input(false);
  readonly available = !!Sentry.getFeedback();
  readonly form = inject(FeedbackForm);
  readonly failed = signal(false);

  async open(): Promise<void> {
    this.failed.set(false);
    try {
      await this.form.open(this.problem());
    } catch {
      this.failed.set(true);
    }
  }
}
