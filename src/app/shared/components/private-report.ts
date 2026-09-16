import { UI_FIELDS } from "../ui/field";
import { UI_BUTTONS } from "../ui/native-button";
import { Component, inject, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MODERATION_SERVICE } from "../../core/services/service-tokens";
import { ReportTarget } from "../../core/services/contracts/moderation";
import { ActionState } from "../state/action-state";
import { ActionFeedback } from "./action-feedback";
@Component({
  selector: "app-private-report",
  imports: [...UI_BUTTONS, ...UI_FIELDS, FormsModule, ActionFeedback],
  template: `
    <button
      matButton
      appButton="text"
      type="button"
      class="report-trigger"
      [class.compact]="compact()"
      [attr.aria-label]="'Report ' + target()"
      (click)="open(dialog)"
    >
      {{ compact() ? 'Report' : 'Report ' + target() }}
    </button>
    <dialog
      #dialog
      class="workflow-dialog"
      aria-label="Send a private report"
      (cancel)="cancel($event)"
    >
      <form ngNativeValidate (ngSubmit)="submit(dialog)">
        <p class="eyebrow">Private feedback</p>
        <h2>Report this {{ target() }}</h2>
        <p>
          Help keep this community thoughtful and useful. Choose what needs
          attention and an administrator will review it.
        </p>
        <mat-form-field appField="What’s the issue?" #field1="appField"
          ><mat-label>What’s the issue?</mat-label
          ><select
            matNativeControl
            name="category"
            [(ngModel)]="category"
            required
            [disabled]="action.busy()"
            autofocus
          >
            <option value="" disabled>Select a reason</option>
            <option>Spam or advertising</option>
            <option>Harassment or hateful content</option>
            <option>Misleading or unsafe claims</option>
            <option>Privacy concern</option>
            <option>Broken or incorrect content</option>
            <option>Something else</option>
          </select>
          <mat-error>{{
            field1.validationMessage()
          }}</mat-error></mat-form-field
        >
        <mat-form-field
          appField="{{
            category === 'Something else'
              ? 'Tell us what happened'
              : 'Anything else we should know? (optional)'
          }}"
          #field2="appField"
          ><mat-label>{{
            category === "Something else"
              ? "Tell us what happened"
              : "Anything else we should know? (optional)"
          }}</mat-label>
          <textarea
            matInput
            name="details"
            [(ngModel)]="details"
            [required]="category === 'Something else'"
            maxlength="1800"
            rows="4"
            placeholder="A little context helps us understand the issue."
            [disabled]="action.busy()"
          ></textarea>
          <mat-error>{{
            field2.validationMessage()
          }}</mat-error></mat-form-field
        >
        <small
          >Only you and administrators can see this report. You can follow its
          status on your profile.</small
        >
        <app-action-feedback [error]="action.error()" />
        <div class="dialog-actions">
          <button
            matButton
            appButton="secondary"
            type="button"
            [disabled]="action.busy()"
            (click)="dialog.close()"
          >
            Cancel
          </button>
          <button
            matButton
            appButton="primary"
            type="submit"
            [disabled]="action.busy()"
          >
            {{ action.busy() ? "Sending…" : "Send report" }}
          </button>
        </div>
      </form>
    </dialog>
    <app-action-feedback [message]="action.message()" />
  `,
  styleUrls: ["./workflow-dialog.css"],
  styles: [
    `
      :host {
        display: block;
      }
      .report-trigger {
        font-size: 0.8rem;
        color: var(--muted);
        padding: 6px 0;
      }
      .report-trigger.compact {
        display: block;
        height: 20px;
        min-height: 0;
        min-width: 0;
        padding: 0;
        font-size: 0.72rem;
        line-height: 20px;
      }
    `,
  ],
})
export class PrivateReportComponent {
  readonly target = input.required<ReportTarget>();
  readonly targetId = input.required<string>();
  readonly compact = input(false);
  readonly service = inject(MODERATION_SERVICE);
  readonly action = new ActionState();
  category = "";
  details = "";
  open(dialog: HTMLDialogElement) {
    this.action.error.set("");
    this.action.message.set("");
    dialog.showModal();
  }
  cancel(event: Event) {
    if (this.action.busy()) event.preventDefault();
  }
  submit(dialog: HTMLDialogElement) {
    if (
      !this.category ||
      (this.category === "Something else" && !this.details.trim())
    ) {
      this.action.error.set(
        "Choose a reason and describe the issue if you selected Something else.",
      );
      return;
    }
    void this.action.run(async () => {
      await this.service.report(
        this.target(),
        this.targetId(),
        [this.category, this.details.trim()].filter(Boolean).join(": "),
      );
      this.category = "";
      this.details = "";
      dialog.close();
    }, "Report sent. Follow its status on your profile.");
  }
}
