import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SourceCount } from '../../core/api/models';

/** Top sources as horizontal bars; each row links to the filtered list. */
@Component({
  selector: 'app-source-bars',
  imports: [RouterLink],
  template: `
    @if (rows().length) {
      <ol class="rows">
        @for (row of rows(); track row.label) {
          <li>
            @if (row.source) {
              <a class="label" [routerLink]="['/leads']" [queryParams]="{ source: row.source }">
                {{ row.label }}
              </a>
            } @else {
              <span class="label muted">{{ row.label }}</span>
            }
            <span class="track" aria-hidden="true">
              <span class="fill" [style.width.%]="row.width"></span>
            </span>
            <span class="count">{{ row.count }}</span>
          </li>
        }
      </ol>
    } @else {
      <p class="muted">Sin leads en este periodo.</p>
    }
  `,
  styles: `
    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    li {
      display: grid;
      grid-template-columns: minmax(80px, 160px) 1fr auto;
      align-items: center;
      gap: 12px;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--mat-sys-primary);
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
    .track {
      height: 12px;
      border-radius: 6px;
      background: var(--mat-sys-surface-container-highest);
      overflow: hidden;
    }
    .fill {
      display: block;
      height: 100%;
      background: var(--mat-sys-primary);
      border-radius: 6px;
    }
    .count {
      font: var(--mat-sys-label-large);
      min-width: 3ch;
      text-align: right;
    }
  `,
})
export class SourceBars {
  readonly data = input.required<SourceCount[]>();

  protected readonly rows = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.count));
    return this.data().map((d) => ({
      ...d,
      label: d.source ?? 'Sin fuente',
      width: (d.count / max) * 100,
    }));
  });
}
