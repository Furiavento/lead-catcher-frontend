import { Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { formatPercent } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LeadsApi } from '../../core/api/leads-api.service';
import { LEAD_STATUSES } from '../../core/api/models';
import { ErrorBanner } from '../../shared/error-banner';
import { daysAgo, endOfDayIso, localTimeZone, startOfDayIso } from '../../shared/date-range';
import { STATUS_LABELS } from '../../shared/lead-status';
import { DailyChart } from './daily-chart';
import { SourceBars } from './source-bars';

const PRESETS = [7, 30, 90] as const;

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    MatButtonToggleModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    DailyChart,
    ErrorBanner,
    SourceBars,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private readonly leadsApi = inject(LeadsApi);
  private readonly locale = inject(LOCALE_ID);

  protected readonly presets = PRESETS;
  protected readonly today = new Date();
  protected readonly start = signal<Date | null>(daysAgo(29));
  protected readonly end = signal<Date | null>(new Date());
  protected readonly preset = signal<number | null>(30);

  /** Only query once both ends of the range are picked. */
  private readonly range = computed(() => {
    const start = this.start();
    const end = this.end();
    return start && end
      ? { from: startOfDayIso(start), to: endOfDayIso(end), tz: localTimeZone() }
      : undefined;
  });

  protected readonly stats = rxResource({
    params: () => this.range(),
    stream: ({ params }) => this.leadsApi.stats(params),
  });

  protected readonly statusTiles = computed(() => {
    const byStatus = this.stats.value()?.byStatus;
    return LEAD_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: byStatus?.[status] ?? 0,
    }));
  });

  /** Share of converted leads, formatted; null when there are no leads. */
  protected readonly conversionRate = computed(() => {
    const stats = this.stats.value();
    if (!stats?.total) return null;
    return formatPercent(stats.byStatus.converted / stats.total, this.locale, '1.1-1');
  });

  protected applyPreset(days: number): void {
    this.preset.set(days);
    this.start.set(daysAgo(days - 1));
    this.end.set(new Date());
  }

  protected setStart(date: Date | null): void {
    this.preset.set(null);
    this.start.set(date);
  }

  protected setEnd(date: Date | null): void {
    this.preset.set(null);
    this.end.set(date);
  }
}
