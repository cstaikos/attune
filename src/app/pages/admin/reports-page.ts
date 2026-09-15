import { ListView } from "../../shared/components/list-view";
import { Component, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import { MODERATION_SERVICE } from "../../core/services/service-tokens";
import { PrivateReport } from "../../core/services/contracts/moderation";
import { MemberSession } from "../../core/auth/member-session";
import { PageLoad } from "../../shared/state/page-load";
import { PageStatus } from "../../shared/components/page-status";
@Component({
  selector: "app-reports-page",
  imports: [ListView, DatePipe, PageStatus],
  template: `
    <section class="detail-page">
      <h2>My private reports</h2>
      <p>Only you and administrators can see these reports.</p>
      <app-page-status
        [loading]="page.loading()"
        [error]="page.error()"
        (retry)="load()"
      />
      @if (page.data(); as reports) {
        <app-list-view
          [items]="reports"
          label="My reports"
          [filters]="filters"
          emptyMessage="You have not submitted any reports."
        >
          <ng-template let-report>
            <article>
              <h3>{{ report.target_type }} report · {{ report.status }}</h3>
              <p>{{ report.reason }}</p>
              <small>{{ report.created_at | date: "medium" }}</small>
            </article>
          </ng-template>
        </app-list-view>
      }
    </section>
  `,
  styles: [
    `
      section {
        max-width: 800px;
        margin: auto;
        padding: 24px;
      }
      article {
        margin-block: 16px;
        padding: 16px;
        border: 1px solid #d9ddd4;
        border-radius: 12px;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class ReportsPage {
  readonly filters = [
    {
      key: "status",
      label: "Status",
      options: ["open", "resolved", "dismissed"].map((value) => ({
        value,
        label: value,
      })),
    },
  ];
  private readonly service = inject(MODERATION_SERVICE);
  private readonly member = inject(MemberSession);
  readonly page = new PageLoad<PrivateReport[]>();
  constructor() {
    void this.load();
  }
  load() {
    return this.page.run(async () =>
      (await this.service.reports())
        .filter(
          (report) => report.reporter_id === this.member.session()?.userId,
        )
        .reverse(),
    );
  }
}
