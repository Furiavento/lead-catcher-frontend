import { Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DailyCount } from '../../core/api/models';

/** Leads per day as a bar chart, with a visually hidden table for screen readers. */
@Component({
  selector: 'app-daily-chart',
  imports: [DatePipe, MatTooltipModule],
  template: `
    <div class="chart" role="img" [attr.aria-label]="summary()">
      <div class="y-axis" aria-hidden="true">
        <span>{{ max() }}</span>
        <span>0</span>
      </div>
      <div class="plot" aria-hidden="true">
        @for (day of bars(); track day.date) {
          <div class="bar-slot" [matTooltip]="(day.date | date: 'EEE d MMM') + ': ' + day.count">
            <div class="bar" [style.height.%]="day.height" [class.empty]="day.count === 0"></div>
          </div>
        }
      </div>
      <div class="x-axis" aria-hidden="true">
        <span>{{ first() | date: 'd MMM' }}</span>
        <span>{{ last() | date: 'd MMM' }}</span>
      </div>
    </div>

    <table class="visually-hidden">
      <caption>
        Leads por día
      </caption>
      <thead>
        <tr>
          <th scope="col">Día</th>
          <th scope="col">Leads</th>
        </tr>
      </thead>
      <tbody>
        @for (day of data(); track day.date) {
          <tr>
            <td>{{ day.date | date: 'longDate' }}</td>
            <td>{{ day.count }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }
    .chart {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: 200px auto;
      column-gap: 8px;
    }
    .y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: right;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .plot {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      border-left: 1px solid var(--mat-sys-outline-variant);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      padding: 0 2px;
    }
    .bar-slot {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: flex-end;
      min-width: 2px;
    }
    .bar-slot:hover .bar {
      background: var(--mat-sys-tertiary);
    }
    .bar {
      width: 100%;
      background: var(--mat-sys-primary);
      border-radius: 3px 3px 0 0;
      min-height: 2px;
    }
    .bar.empty {
      background: var(--mat-sys-outline-variant);
    }
    .x-axis {
      grid-column: 2;
      display: flex;
      justify-content: space-between;
      padding-top: 4px;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class DailyChart {
  private readonly locale = inject(LOCALE_ID);

  readonly data = input.required<DailyCount[]>();

  protected readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.count)));
  protected readonly bars = computed(() =>
    this.data().map((d) => ({ ...d, height: (d.count / this.max()) * 100 })),
  );
  protected readonly first = computed(() => this.data()[0]?.date);
  protected readonly last = computed(() => this.data().at(-1)?.date);
  protected readonly summary = computed(() => {
    const days = this.data();
    const [firstDay] = days;
    const lastDay = days.at(-1);
    if (!firstDay || !lastDay) return 'Sin datos';
    const total = days.reduce((sum, d) => sum + d.count, 0);
    const peak = days.reduce((a, b) => (b.count > a.count ? b : a));
    const format = (date: string) => formatDate(date, 'd MMM', this.locale);
    return (
      `Gráfico de leads por día del ${format(firstDay.date)} al ${format(lastDay.date)}: ` +
      `${total} en total, máximo ${peak.count} el ${format(peak.date)}. ` +
      'Los datos están en la tabla siguiente.'
    );
  });
}
