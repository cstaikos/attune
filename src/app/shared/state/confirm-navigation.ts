import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ConfirmNavigation {
  readonly message = signal("");
  private resolve: ((answer: boolean) => void) | undefined;

  ask(message: string): Promise<boolean> {
    this.answer(false);
    this.message.set(message);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  answer(answer: boolean): void {
    this.message.set("");
    this.resolve?.(answer);
    this.resolve = undefined;
  }
}
