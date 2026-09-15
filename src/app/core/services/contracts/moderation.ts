export type ReportTarget = "playlist" | "comment" | "profile";
export interface PrivateReport {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}
export interface AdminMember {
  user_id: string;
  username: string;
  status: "active" | "suspended";
  role: "member" | "admin";
}
export interface AuditEntry {
  target_type: ReportTarget | "report" | "member";
  before_state: unknown;
  after_state: unknown;
  id: string;
  actor_id: string;
  action: string;
  target_id: string;
  reason: string;
  created_at: string;
}
export type ModerationAction =
  | "hide"
  | "restore"
  | "resolve"
  | "dismiss"
  | "suspend"
  | "unsuspend"
  | "grant_admin"
  | "revoke_admin";
export interface ModerationService {
  isAdmin(): Promise<boolean>;
  report(target: ReportTarget, id: string, reason: string): Promise<void>;
  reports(): Promise<PrivateReport[]>;
  members(): Promise<AdminMember[]>;
  audit(): Promise<AuditEntry[]>;
  act(
    action: ModerationAction,
    target: ReportTarget | "report" | "member",
    id: string,
    reason: string,
  ): Promise<void>;
}
