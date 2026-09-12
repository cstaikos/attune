import { BehaviorSubject, map } from "rxjs";
import { Session } from "../../models/library";
import { createSeedState } from "../../data/seed-state";
import { ServiceError } from "../service-error";
import { MockControls } from "./mock-controls";
import { MOCK_STORAGE_KEY, MockState, MockStorage } from "./mock-state";
import { validateState } from "./validate-state";

export class MockStore {
  private state: MockState;
  private readonly sessionSubject: BehaviorSubject<Session | null>;
  readonly session$;
  constructor(
    private readonly storage: MockStorage,
    readonly controls = new MockControls(),
  ) {
    try {
      const saved = storage.getItem(MOCK_STORAGE_KEY);
      this.state =
        saved === null ? createSeedState() : validateState(JSON.parse(saved));
    } catch {
      throw new ServiceError(
        "storage",
        "Mock data could not be loaded. Export or clear the Angular mock storage entry before retrying.",
      );
    }
    this.sessionSubject = new BehaviorSubject<Session | null>(
      this.state.session,
    );
    this.session$ = this.sessionSubject.pipe(
      map((session) => structuredClone(session)),
    );
  }
  async read<T>(operation: string, read: (state: MockState) => T): Promise<T> {
    await this.controls.before(operation);
    return structuredClone(read(structuredClone(this.state)));
  }
  async write<T>(
    operation: string,
    change: (state: MockState) => T,
  ): Promise<T> {
    await this.controls.before(operation);
    // No await inside this transaction: concurrent requests see the latest committed state.
    const next = structuredClone(this.state);
    const result = change(next);
    try {
      this.storage.setItem(MOCK_STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new ServiceError(
        "storage",
        "Changes could not be saved on this device.",
      );
    }
    const changedSession = next.session?.userId !== this.state.session?.userId;
    this.state = next;
    if (changedSession) this.sessionSubject.next(structuredClone(next.session));
    return structuredClone(result);
  }
}
export function requireUser(state: MockState): string {
  if (!state.session)
    throw new ServiceError("unauthenticated", "Sign in to continue.");
  return state.session.userId;
}
export function findPlaylist(state: MockState, id: string) {
  const playlist = state.playlists.find((item) => item.id === id);
  if (!playlist) throw new ServiceError("not-found", "Playlist not found.");
  return playlist;
}
export function findProfile(state: MockState, id: string) {
  const profile = state.profiles.find((item) => item.id === id);
  if (!profile) throw new ServiceError("not-found", "Profile not found.");
  return profile;
}
