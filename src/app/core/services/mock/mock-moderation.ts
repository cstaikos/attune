import {
  ModerationService,
  ModerationAction,
  ReportTarget,
  AdminMember,
  PrivateReport,
  AuditEntry,
} from "../contracts/moderation";
import { MockStore, requireUser } from "./mock-store";
import { MockState } from "./mock-state";
import { ServiceError } from "../service-error";
export interface MockModerationState {
  members: AdminMember[];
  reports: PrivateReport[];
  audit: AuditEntry[];
  hidden: string[];
}
export function moderation(s: MockState): MockModerationState {
  return (s.moderation ??= {
    members: s.profiles.map((p) => ({
      user_id: p.id,
      username: p.username,
      status: "active",
      role: "member",
    })),
    reports: [],
    audit: [],
    hidden: [],
  });
}
function admin(s: MockState) {
  const id = requireUser(s);
  if (
    !moderation(s).members.some((m) => m.user_id === id && m.role === "admin")
  )
    throw new ServiceError("forbidden", "Administrator permission required.");
  return id;
}
export class MockModeration implements ModerationService {
  constructor(private readonly store: MockStore) {}
  isAdmin() {
    return this.store.read("moderation.access", (s) => {
      const id = requireUser(s);
      return moderation(s).members.some(
        (m) => m.user_id === id && m.role === "admin",
      );
    });
  }
  report(target: ReportTarget, id: string, reason: string) {
    return this.store.write("moderation.report", (s) => {
      const reporter_id = requireUser(s),
        state = moderation(s);
      const exists =
        target === "profile"
          ? s.profiles.some((p) => p.id === id)
          : s.playlists.some(
              (p) =>
                !state.hidden.includes(p.id) &&
                (target === "playlist"
                  ? p.id === id
                  : p.comments.some(
                      (c) => c.id === id && !state.hidden.includes(c.id),
                    )),
            );
      if (!exists || !reason.trim() || reason.length > 2000)
        throw new ServiceError(
          "invalid-input",
          "Check the target and report reason.",
        );
      if (
        state.reports.some(
          (r) =>
            r.reporter_id === reporter_id &&
            r.target_type === target &&
            r.target_id === id &&
            r.status === "open",
        )
      )
        throw new ServiceError(
          "conflict",
          "You already have an open report for this item.",
        );
      state.reports.push({
        id: crypto.randomUUID(),
        reporter_id,
        target_type: target,
        target_id: id,
        reason: reason.trim(),
        status: "open",
        created_at: new Date().toISOString(),
      });
    });
  }
  reports() {
    return this.store.read("moderation.reports", (s) => {
      const id = requireUser(s),
        state = moderation(s);
      return state.reports.filter(
        (r) =>
          r.reporter_id === id ||
          state.members.some((m) => m.user_id === id && m.role === "admin"),
      );
    });
  }
  members() {
    return this.store.read("moderation.members", (s) => {
      admin(s);
      return moderation(s).members;
    });
  }
  audit() {
    return this.store.read("moderation.audit", (s) => {
      admin(s);
      return moderation(s).audit;
    });
  }
  act(
    action: ModerationAction,
    target: ReportTarget | "report" | "member",
    id: string,
    reason: string,
  ) {
    return this.store.write("moderation.act", (s) => {
      const actor_id = admin(s),
        state = moderation(s);
      if (!reason.trim() || reason.length > 2000)
        throw new ServiceError(
          "invalid-input",
          "Provide a reason of 1–2000 characters.",
        );
      let before: unknown, after: unknown;
      if (
        target === "member" &&
        ["suspend", "unsuspend", "grant_admin", "revoke_admin"].includes(action)
      ) {
        const member = state.members.find((m) => m.user_id === id);
        if (!member || id === actor_id)
          throw new ServiceError(
            "forbidden",
            "Cannot change this account's access.",
          );
        before = structuredClone(member);
        if (action === "suspend") member.status = "suspended";
        if (action === "unsuspend") member.status = "active";
        if (action === "grant_admin") member.role = "admin";
        if (action === "revoke_admin") member.role = "member";
        after = member;
      } else if (
        target === "report" &&
        ["resolve", "dismiss"].includes(action)
      ) {
        const report = state.reports.find((r) => r.id === id);
        if (!report || report.status !== "open")
          throw new ServiceError("conflict", "Open report not found.");
        before = structuredClone(report);
        report.status = action === "resolve" ? "resolved" : "dismissed";
        after = report;
      } else if (
        (target === "playlist" || target === "comment") &&
        ["hide", "restore"].includes(action)
      ) {
        if (
          !s.playlists.some((p) =>
            target === "playlist"
              ? p.id === id
              : p.comments.some((c) => c.id === id),
          )
        )
          throw new ServiceError("not-found", "Content not found.");
        before = { hidden: state.hidden.includes(id) };
        state.hidden = state.hidden.filter((x) => x !== id);
        if (action === "hide") {
          state.hidden.push(id);
          for (const report of state.reports.filter(
            (r) =>
              r.target_type === target &&
              r.target_id === id &&
              r.status === "open",
          )) {
            const previous = structuredClone(report);
            report.status = "resolved";
            state.audit.push({
              id: crypto.randomUUID(),
              actor_id,
              action: "resolve",
              target_type: "report",
              target_id: report.id,
              reason: reason.trim(),
              created_at: new Date().toISOString(),
              before_state: previous,
              after_state: structuredClone(report),
            });
          }
        }
        after = { hidden: action === "hide" };
      } else
        throw new ServiceError("invalid-input", "Invalid moderation action.");
      state.audit.push({
        id: crypto.randomUUID(),
        actor_id,
        action,
        target_type: target,
        target_id: id,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
        before_state: structuredClone(before),
        after_state: structuredClone(after),
      });
    });
  }
}
