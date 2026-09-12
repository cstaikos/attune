import { effect, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { AUTH_SERVICE, PROFILE_SERVICE } from "../services/service-tokens";
import { PageLoad } from "../../shared/state/page-load";
import { Profile } from "../models/library";
@Injectable({ providedIn: "root" })
export class MemberSession {
  private readonly auth = inject(AUTH_SERVICE);
  private readonly profiles = inject(PROFILE_SERVICE);
  readonly session = toSignal(this.auth.session$, { initialValue: null });
  readonly profile = new PageLoad<Profile | null>();
  constructor() {
    effect(() => {
      const session = this.session();
      void this.profile.run(() =>
        session ? this.profiles.get(session.userId) : Promise.resolve(null),
      );
    });
  }
  refresh() {
    const session = this.session();
    return this.profile.run(() =>
      session ? this.profiles.get(session.userId) : Promise.resolve(null),
    );
  }
}
