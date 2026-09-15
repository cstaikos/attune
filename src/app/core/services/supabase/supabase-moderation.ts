import { SupabaseClient } from "@supabase/supabase-js";
import {
  ModerationService,
  ReportTarget,
  ModerationAction,
  PrivateReport,
  AdminMember,
  AuditEntry,
} from "../contracts/moderation";
import { result, rows } from "./database";
export class SupabaseModeration implements ModerationService {
  constructor(private readonly client: SupabaseClient) {}
  async isAdmin() {
    const data = await result(this.client.rpc("my_membership"));
    return data?.[0]?.role === "admin" && data?.[0]?.status === "active";
  }
  async report(target: ReportTarget, id: string, reason: string) {
    await result(
      this.client.rpc("submit_private_report", {
        target,
        target_id: id,
        reason,
      }),
    );
  }
  reports() {
    return rows<PrivateReport>(
      this.client,
      "private_reports",
      "*",
      "created_at,id",
    );
  }
  async members(): Promise<AdminMember[]> {
    return (await result(this.client.rpc("admin_members"))) ?? [];
  }
  audit() {
    return rows<AuditEntry>(
      this.client,
      "moderation_audit",
      "*",
      "created_at,id",
    );
  }
  async act(
    action: ModerationAction,
    target: ReportTarget | "report" | "member",
    id: string,
    reason: string,
  ) {
    await result(
      this.client.rpc("moderate", { action, target, target_id: id, reason }),
    );
  }
}
