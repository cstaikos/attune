import {
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from "@angular/core";
import { ConfirmNavigation } from "../state/confirm-navigation";

@Component({
  selector: "app-leave-dialog",
  template: `
    <dialog
      #dialog
      class="modal leave-dialog"
      aria-labelledby="leave-title"
      (cancel)="cancel($event)"
    >
      <div class="modal-body">
        <h2 id="leave-title">Leave without saving?</h2>
        <p>{{ confirmation.message() }}</p>
        <div class="modal-actions">
          <button
            class="ghost-button"
            autofocus
            (click)="confirmation.answer(false)"
          >
            Keep editing
          </button>
          <button class="primary-button" (click)="confirmation.answer(true)">
            Discard changes
          </button>
        </div>
      </div>
    </dialog>
  `,
})
export class LeaveDialog {
  readonly confirmation = inject(ConfirmNavigation);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  constructor() {
    effect(() => {
      const message = this.confirmation.message();
      const dialog = this.dialog().nativeElement;
      if (message && !dialog.open) dialog.showModal();
      else if (!message && dialog.open) dialog.close();
    });
  }
  cancel(event: Event): void {
    event.preventDefault();
    this.confirmation.answer(false);
  }
}
