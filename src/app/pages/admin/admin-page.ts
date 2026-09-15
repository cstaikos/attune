import { UI_FIELDS } from "../../shared/ui/field";
import { UI_BUTTONS } from "../../shared/ui/native-button";
import { ListView, ListFilter } from "../../shared/components/list-view";
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from "@angular/core";
import { DatePipe, JsonPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MemberSession } from "../../core/auth/member-session";
import { Playlist, Profile } from "../../core/models/library";
import { FormsModule } from "@angular/forms";
import {
  MODERATION_SERVICE,
  PLAYLIST_SERVICE,
  PROFILE_SERVICE,
} from "../../core/services/service-tokens";
import {
  PrivateReport,
  AdminMember,
  AuditEntry,
  ModerationAction,
  ReportTarget,
} from "../../core/services/contracts/moderation";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
@Component({
  selector: "app-admin-page",
  imports: [
    ...UI_BUTTONS,
    ...UI_FIELDS,
    ListView,
    FormsModule,
    PageStatus,
    ActionFeedback,
    RouterLink,
    DatePipe,
    JsonPipe,
  ],
  templateUrl: "./admin-page.html",
  styleUrls: ["../../shared/components/workflow-dialog.css"],
  styles: [
    `
      .admin-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-block: 24px;
        border-bottom: 1px solid var(--line);
        padding-bottom: 12px;
      }
      .admin-tabs button[aria-pressed="true"] {
        background: var(--teal);
        color: white;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        background: var(--surface-soft);
        font-size: 0.8rem;
        text-transform: capitalize;
      }
      .report-meta {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .admin-page {
        max-width: 960px;
        margin-inline: auto;
        padding: 24px;
      }
      article {
        padding: 20px;
        margin-block: 16px;
        border: 1px solid #d9ddd4;
        border-radius: 12px;
        overflow-wrap: anywhere;
      }
      button {
        margin: 4px 8px 4px 0;
        padding: 8px 12px;
      }
      label {
        display: grid;
        gap: 8px;
      }
      textarea {
        min-height: 88px;
        width: 100%;
      }
      blockquote,
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      h3 {
        margin-top: 32px;
      }
    `,
  ],
})
export class AdminPage {
  readonly currentMember = inject(MemberSession);
  private readonly playlists = inject(PLAYLIST_SERVICE);
  private readonly profiles = inject(PROFILE_SERVICE);
  private readonly service = inject(MODERATION_SERVICE);
  readonly page = new PageLoad<{
    reports: PrivateReport[];
    members: AdminMember[];
    audit: AuditEntry[];
    playlists: Playlist[];
    profiles: Profile[];
  }>();
  readonly action = new ActionState();
  reason = "";
  constructor() {
    void this.load();
  }
  disabled() {
    return this.action.busy();
  }
  load(retainData = false) {
    return this.page.run(async () => {
      const [reports, members, audit, playlists, profiles] = await Promise.all([
        this.service.reports(),
        this.service.members(),
        this.service.audit(),
        this.playlists.list(),
        this.profiles.list(),
      ]);
      return {
        reports: reports.sort(
          (a, b) =>
            b.created_at.localeCompare(a.created_at) ||
            a.id.localeCompare(b.id),
        ),
        members: members.sort((a, b) => a.username.localeCompare(b.username)),
        audit: audit.sort(
          (a, b) =>
            b.created_at.localeCompare(a.created_at) ||
            a.id.localeCompare(b.id),
        ),
        playlists,
        profiles,
      };
    }, retainData);
  }
  name(id: string) {
    return (
      this.page.data()?.members.find((m) => m.user_id === id)?.username ?? id
    );
  }
  preview(report: PrivateReport) {
    const data = this.page.data();
    if (report.target_type === "profile") {
      const profile = data?.profiles.find((p) => p.id === report.target_id);
      return profile
        ? {
            hidden: false,
            title: profile.displayName || profile.username,
            body: profile.bio,
            path: ["/profile", profile.id],
          }
        : null;
    }
    const playlist = data?.playlists.find((p) =>
      report.target_type === "playlist"
        ? p.id === report.target_id
        : p.comments.some((c) => c.id === report.target_id),
    );
    return playlist
      ? {
          hidden: !!(report.target_type === "playlist"
            ? playlist.hidden
            : playlist.comments.find((c) => c.id === report.target_id)?.hidden),
          title: playlist.title,
          body:
            report.target_type === "playlist"
              ? playlist.notes
              : playlist.comments.find((c) => c.id === report.target_id)!.body,
          path: ["/playlist", playlist.id],
        }
      : null;
  }
  hiddenContent() {
    return (this.page.data()?.playlists ?? []).flatMap((p) => [
      ...(p.hidden
        ? [
            {
              id: p.id,
              playlistId: p.id,
              title: p.title,
              body: p.notes,
              target: "playlist" as const,
            },
          ]
        : []),
      ...p.comments
        .filter((c) => c.hidden)
        .map((c) => ({
          id: c.id,
          playlistId: p.id,
          title: p.title,
          body: c.body,
          target: "comment" as const,
        })),
    ]);
  }
  readonly section = signal("reports");
  readonly sections = [
    { key: "reports", label: "Reports" },
    { key: "hidden", label: "Hidden content" },
    { key: "members", label: "Members" },
    { key: "audit", label: "Audit log" },
  ];
  readonly reportFilters: ListFilter[] = [
    {
      key: "status",
      label: "Status",
      options: ["open", "resolved", "dismissed"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "target_type",
      label: "Content type",
      options: ["playlist", "comment", "profile"].map((value) => ({
        value,
        label: value,
      })),
    },
  ];
  readonly memberFilters: ListFilter[] = [
    {
      key: "status",
      label: "Status",
      options: ["active", "suspended"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "role",
      label: "Role",
      options: ["member", "admin"].map((value) => ({ value, label: value })),
    },
  ];
  readonly auditFilters: ListFilter[] = [
    {
      key: "action",
      label: "Action",
      options: [
        "hide",
        "restore",
        "resolve",
        "dismiss",
        "suspend",
        "unsuspend",
        "grant_admin",
        "revoke_admin",
      ].map((value) => ({ value, label: value.replaceAll("_", " ") })),
    },
    {
      key: "target_type",
      label: "Content type",
      options: ["playlist", "comment", "profile", "report", "member"].map(
        (value) => ({ value, label: value }),
      ),
    },
  ];
  readonly hiddenFilters: ListFilter[] = [
    {
      key: "target",
      label: "Content type",
      options: ["playlist", "comment"].map((value) => ({
        value,
        label: value,
      })),
    },
  ];
  readonly reportSearch = (r: PrivateReport) =>
    [
      r.reason,
      r.target_type,
      r.target_id,
      this.name(r.reporter_id),
      this.preview(r)?.title,
    ].join(" ");
  readonly auditSearch = (r: AuditEntry) =>
    [
      r.reason,
      r.action,
      r.target_type,
      r.target_id,
      this.name(r.actor_id),
    ].join(" ");
  readonly memberKey = (m: AdminMember) => m.user_id;
  private readonly injector = inject(Injector);
  readonly decision =
    viewChild.required<ElementRef<HTMLDialogElement>>("decision");
  readonly pending = signal<{
    action: ModerationAction;
    target: ReportTarget | "report" | "member";
    id: string;
    title: string;
  } | null>(null);
  actionLabel(action: ModerationAction) {
    return {
      hide: "Hide content",
      restore: "Restore content",
      resolve: "Resolve report",
      dismiss: "Dismiss report",
      suspend: "Suspend account",
      unsuspend: "Restore account",
      grant_admin: "Grant administrator access",
      revoke_admin: "Revoke administrator access",
    }[action];
  }
  act(
    action: ModerationAction,
    target: ReportTarget | "report" | "member",
    id: string,
  ) {
    const report = this.page
      .data()
      ?.reports.find((r) =>
        target === "report"
          ? r.id === id
          : r.target_type === target && r.target_id === id,
      );
    const title =
      target === "member"
        ? this.name(id)
        : report
          ? this.preview(report)?.title || report.reason
          : this.hiddenContent().find((item) => item.id === id)?.title || id;
    this.reason = "";
    this.action.error.set("");
    this.action.message.set("");
    this.pending.set({ action, target, id, title });
    afterNextRender(() => this.decision().nativeElement.showModal(), {
      injector: this.injector,
    });
  }
  cancelDecision(event: Event) {
    if (this.action.busy()) event.preventDefault();
  }
  confirm() {
    const decision = this.pending();
    if (!decision) return;
    if (!this.reason.trim()) {
      this.action.error.set("Enter a reason for this decision.");
      return;
    }
    void this.action.run(async () => {
      await this.service.act(
        decision.action,
        decision.target,
        decision.id,
        this.reason.trim(),
      );
      this.decision().nativeElement.close();
      this.pending.set(null);
      this.reason = "";
      await this.load(true);
    }, "Decision saved in the audit log.");
  }
}
