import { SupabaseClient } from "@supabase/supabase-js";
import { ReplaySubject } from "rxjs";
import { Session } from "../../models/library";
import { AuthService, Credentials, Registration } from "../contracts/auth";

export class SupabaseAuth implements AuthService {
  private readonly sessions = new ReplaySubject<Session | null>(1);
  readonly session$ = this.sessions.asObservable();
  private revision = 0;
  private logoutEpoch = 0;
  private readonly subscription;

  constructor(
    private readonly client: SupabaseClient,
    private readonly origin: string,
  ) {
    this.subscription = client.auth.onAuthStateChange((event) => {
      // Never call Auth APIs inside this callback: the SDK holds its session lock.
      if (event === "SIGNED_OUT") {
        this.logoutEpoch++;
        this.revision++;
        this.sessions.next(null);
      } else {
        setTimeout(() => {
          void this.getAccess().catch(() => {});
        }, 0);
      }
    }).data.subscription;
  }

  destroy() {
    this.subscription.unsubscribe();
  }

  async getAccess(): Promise<Session | null> {
    const revision = ++this.revision;
    const logoutEpoch = this.logoutEpoch;
    try {
      const stored = await this.client.auth.getSession();
      if (stored.error) throw stored.error;
      let session: Session | null = null;
      if (stored.data.session) {
        const { data, error } = await this.client.auth.getUser();
        if (error) throw error;
        if (data.user.email_confirmed_at) {
          const membership = await this.client.rpc("my_membership");
          if (membership.error) throw membership.error;
          session = {
            userId: data.user.id,
            membership:
              membership.data?.[0]?.status === "active"
                ? "active"
                : membership.data?.[0]
                  ? "suspended"
                  : "pending",
          };
        }
      }
      if (logoutEpoch !== this.logoutEpoch) return null;
      if (revision === this.revision) this.sessions.next(session);
      return session;
    } catch (error) {
      if (revision === this.revision) this.sessions.next(null);
      throw error;
    }
  }

  async signIn(input: Credentials): Promise<Session> {
    const { error } = await this.client.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (error) throw error;
    const session = await this.getAccess();
    if (!session) throw new Error("Verify your email before signing in.");
    return session;
  }

  async signUp(input: Registration): Promise<void> {
    const { error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { emailRedirectTo: `${this.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async resendVerification(email: string): Promise<void> {
    const { error } = await this.client.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${this.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${this.origin}/auth/callback?recovery=1` },
    );
    if (error) throw error;
  }

  async completeCallback(code: string): Promise<void> {
    if (!code)
      throw new Error(
        "This email link is missing or expired. Request a new link and open it in the browser where you requested it.",
      );
    const { error } = await this.client.auth.exchangeCodeForSession(code);
    if (
      error?.name === "AuthPKCECodeVerifierMissingError" ||
      error?.code === "pkce_code_verifier_not_found" ||
      error?.code === "bad_code_verifier"
    )
      throw new Error(
        "Automatic sign-in could not finish in this browser. Your email may already be verified: try signing in with your email and password. For password recovery, request a new link in this browser and open it here.",
      );
    if (error)
      throw new Error(
        "This sign-in link could not be completed. It may be invalid or expired, or belong to another browser. Your email may already be verified: try signing in. For password recovery, request a new link and open it in the same browser.",
      );
  }

  async updatePassword(password: string): Promise<void> {
    if (password.length < 8)
      throw new Error("Use a password of at least 8 characters.");
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
    await this.signOut();
  }

  async redeemInvitation(
    input: Omit<Registration, "email" | "password">,
  ): Promise<void> {
    const { error } = await this.client.rpc("redeem_invitation", {
      code: input.inviteCode.trim(),
      username: input.username.trim().toLowerCase(),
      display_name: input.displayName?.trim() || null,
      practice: input.practice.trim(),
    });
    if (error) {
      if (error.code === "23505")
        throw new Error(
          "That username is taken, or this account is already a member. Try signing in again or choose another username.",
        );
      if (error.code === "22023")
        throw new Error(
          "This invitation is invalid, expired, or already used.",
        );
      throw new Error(error.message);
    }
    await this.getAccess();
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut({ scope: "global" });
    if (error) throw error;
    this.logoutEpoch++;
    this.revision++;
    this.sessions.next(null);
  }
}
