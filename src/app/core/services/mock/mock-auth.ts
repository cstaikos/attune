import { firstValueFrom } from "rxjs";
import { AuthService, Credentials, Registration } from "../contracts/auth";
import { ServiceError } from "../service-error";
import { hashPassword } from "../../utils/password";
import { findProfile, MockStore } from "./mock-store";
export class MockAuth implements AuthService {
  readonly session$;
  constructor(private readonly store: MockStore) {
    this.session$ = store.session$;
  }
  getAccess() {
    return firstValueFrom(this.session$);
  }
  async resendVerification(_email: string): Promise<void> {
    throw new Error("Email requires Supabase.");
  }
  async requestPasswordReset(_email: string): Promise<void> {
    throw new Error("Email requires Supabase.");
  }
  async updatePassword(_password: string): Promise<void> {
    throw new Error("Recovery requires Supabase.");
  }
  async completeCallback(_code: string): Promise<void> {
    throw new Error("Verification requires Supabase.");
  }
  async redeemInvitation(
    _input: Omit<Registration, "email" | "password">,
  ): Promise<void> {
    throw new Error("Use mock registration.");
  }
  async signIn(credentials: Credentials) {
    const email = credentials.email.trim().toLowerCase();
    const account = await this.store.read("auth.credentials", (s) =>
      s.accounts.find((a) => a.email === email),
    );
    if (
      !account ||
      (await hashPassword(credentials.password, account.salt)) !== account.hash
    )
      throw new ServiceError(
        "invalid-credentials",
        "Email or password is incorrect.",
      );
    return this.store.write("auth.signIn", (s) => {
      findProfile(s, account.userId);
      return (s.session = { userId: account.userId });
    });
  }
  async signUp(input: Registration) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();
    if (
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      input.password.length < 8 ||
      !/^[a-z0-9][a-z0-9-]{2,29}$/.test(username) ||
      !input.practice.trim()
    )
      throw new ServiceError(
        "invalid-input",
        "Provide a valid email, password of at least 8 characters, username, and practice.",
      );
    const salt = crypto.randomUUID();
    const hash = await hashPassword(input.password, salt);
    return this.store.write("auth.signUp", (s) => {
      if (
        s.accounts.some((a) => a.email === email) ||
        s.profiles.some((p) => p.username === username)
      )
        throw new ServiceError(
          "conflict",
          "Email or username is already in use.",
        );
      const invite = s.invitations.find(
        (i) => i.code === input.inviteCode.trim().toUpperCase(),
      );
      if (
        !invite ||
        invite.redeemedBy ||
        (invite.expiresAt && Date.parse(invite.expiresAt) <= Date.now())
      )
        throw new ServiceError(
          "invalid-invite",
          "Invite is invalid, expired, or already used.",
        );
      const displayName = (input.displayName || "").trim();
      const profile = {
        id: crypto.randomUUID(),
        username,
        displayName,
        practice: input.practice.trim(),
        location: "",
        bio: "",
        initials: (displayName || username).slice(0, 2).toUpperCase(),
        inviteCount: 3,
        followerCount: 0,
      };
      s.profiles.push(profile);
      s.accounts.push({ userId: profile.id, email, salt, hash });
      invite.redeemedBy = profile.id;
      s.session = { userId: profile.id };
      return profile;
    });
  }
  signOut() {
    return this.store.write("auth.signOut", (s) => {
      s.session = null;
    });
  }
}
