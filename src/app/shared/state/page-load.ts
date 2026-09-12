import { signal } from "@angular/core";
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
/** Only the most recent request can update a routed screen. */
export class PageLoad<T> {
  readonly data = signal<T | null>(null);
  readonly loading = signal(false);
  readonly error = signal("");
  private request = 0;
  async run(fetch: () => Promise<T>, retainData = false): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    this.error.set("");
    if (!retainData) this.data.set(null);
    try {
      const result = await fetch();
      if (request === this.request) this.data.set(result);
    } catch (error) {
      if (request === this.request) this.error.set(errorMessage(error));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
}
