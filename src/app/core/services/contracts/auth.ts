import { Observable } from "rxjs";
import { Profile, Session } from "../../models/library";
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  username: string;
  practice: string;
  inviteCode: string;
  displayName?: string;
}
export interface AuthService {
  readonly session$: Observable<Session | null>;
  getAccess(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signUp(registration: Registration): Promise<Profile | void>;
  resendVerification(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  completeCallback(code: string, tokens?: { access_token: string; refresh_token: string }): Promise<void>;
  redeemInvitation(
    input: Omit<Registration, "email" | "password">,
  ): Promise<void>;
  signOut(): Promise<void>;
}
