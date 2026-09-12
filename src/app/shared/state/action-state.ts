import { signal } from "@angular/core";
import { errorMessage } from "./page-load";
export class ActionState {
  readonly busy = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  async run(action: () => Promise<void>, message = ""): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.message.set("");
    try {
      await action();
      this.message.set(message);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
