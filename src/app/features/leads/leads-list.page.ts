import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { EMPTY, Subject, finalize, map, switchMap, timer } from 'rxjs';
import { LeadsApi } from '../../core/api/leads-api.service';
import {
  DEFAULT_ORDER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  LEAD_SORTS,
  LEAD_STATUSES,
  LeadFilters,
  LeadStatus,
  MAX_PAGE_SIZE,
  SORT_ORDERS,
} from '../../core/api/models';
import { endOfDayIso, fromDateParam, startOfDayIso, toDateParam } from '../../shared/date-range';
import { downloadBlob } from '../../shared/download';
import { ErrorBanner } from '../../shared/error-banner';
import { STATUS_OPTIONS, StatusBadge } from '../../shared/lead-status';
import { Notifier } from '../../shared/notifier';
import { SpanishPaginatorIntl } from '../../shared/paginator-intl';

const PAGE_SIZES = [10, DEFAULT_PAGE_SIZE, 50, MAX_PAGE_SIZE];
const SEARCH_DEBOUNCE_MS = 350;

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return (values as readonly unknown[]).includes(value);
}

/** Keeps only the value from the URL that the API accepts. */
function pick<T extends string>(values: readonly T[], value: string | undefined): T | undefined {
  return isOneOf(values, value) ? value : undefined;
}

type QueryParams = Record<string, string | number | null>;

@Component({
  selector: 'app-leads-list-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    ErrorBanner,
    StatusBadge,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }],
  templateUrl: './leads-list.page.html',
  styleUrl: './leads-list.page.css',
})
export class LeadsListPage {
  private readonly leadsApi = inject(LeadsApi);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly destroyRef = inject(DestroyRef);

  // Query params, bound by the router. The URL is the source of truth so
  // filters survive reloads and can be shared.
  readonly q = input<string>();
  readonly status = input<string>();
  readonly source = input<string>();
  readonly from = input<string>();
  readonly to = input<string>();
  readonly sort = input<string>();
  readonly order = input<string>();
  readonly page = input(1, { transform: (v: unknown) => Math.max(1, numberAttribute(v, 1)) });
  readonly limit = input(DEFAULT_PAGE_SIZE, {
    transform: (v: unknown) =>
      Math.min(MAX_PAGE_SIZE, Math.max(1, numberAttribute(v, DEFAULT_PAGE_SIZE))),
  });

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly columns = [
    'name',
    'email',
    'status',
    'source',
    'submissionCount',
    'createdAt',
    'lastSubmittedAt',
  ];
  protected readonly exporting = signal(false);

  protected readonly fromDate = computed(() => fromDateParam(this.from()));
  protected readonly toDate = computed(() => fromDateParam(this.to()));
  protected readonly statusValue = computed(() => pick(LEAD_STATUSES, this.status()));
  protected readonly sortValue = computed(() => pick(LEAD_SORTS, this.sort()) ?? DEFAULT_SORT);
  protected readonly orderValue = computed(() => pick(SORT_ORDERS, this.order()) ?? DEFAULT_ORDER);

  private readonly filters = computed<LeadFilters>(() => {
    const from = this.fromDate();
    const to = this.toDate();
    return {
      q: this.q()?.trim() || undefined,
      status: this.statusValue(),
      source: this.source()?.trim() || undefined,
      from: from ? startOfDayIso(from) : undefined,
      to: to ? endOfDayIso(to) : undefined,
      sort: this.sortValue(),
      order: this.orderValue(),
    };
  });

  protected readonly hasFilters = computed(
    () => !!(this.q() || this.status() || this.source() || this.from() || this.to()),
  );

  protected readonly leads = rxResource({
    params: () => ({ ...this.filters(), page: this.page(), limit: this.limit() }),
    stream: ({ params }) => this.leadsApi.list(params),
  });

  protected readonly rows = computed(() => this.leads.value()?.data ?? []);
  protected readonly total = computed(() => this.leads.value()?.meta.total ?? 0);

  /** Typed search terms; `null` cancels a pending one. */
  private readonly search$ = new Subject<string | null>();

  constructor() {
    this.search$
      .pipe(
        switchMap((term) =>
          term === null ? EMPTY : timer(SEARCH_DEBOUNCE_MS).pipe(map(() => term.trim())),
        ),
        takeUntilDestroyed(),
      )
      // Compare with the URL, not the previous term: the URL can change
      // under us (back button, links).
      .subscribe((term) => {
        if (term !== (this.q() ?? '')) this.navigate({ q: term || null, page: null });
      });
  }

  protected onSearch(value: string): void {
    this.search$.next(value);
  }

  protected onStatus(status: LeadStatus | null): void {
    this.navigate({ status, page: null });
  }

  protected onSource(value: string): void {
    this.navigate({ source: value.trim() || null, page: null });
  }

  protected onFrom(date: Date | null): void {
    this.navigate({ from: date ? toDateParam(date) : null, page: null });
  }

  protected onTo(date: Date | null): void {
    this.navigate({ to: date ? toDateParam(date) : null, page: null });
  }

  protected onSort({ active, direction }: Sort): void {
    const sort = isOneOf(LEAD_SORTS, active) ? active : DEFAULT_SORT;
    const order = direction || DEFAULT_ORDER;
    this.navigate({
      sort: sort === DEFAULT_SORT ? null : sort,
      order: order === DEFAULT_ORDER ? null : order,
      page: null,
    });
  }

  protected onPage(event: PageEvent): void {
    this.navigate({
      page: event.pageIndex > 0 ? event.pageIndex + 1 : null,
      limit: event.pageSize !== DEFAULT_PAGE_SIZE ? event.pageSize : null,
    });
  }

  protected clearFilters(): void {
    this.search$.next(null);
    this.navigate({ q: null, status: null, source: null, from: null, to: null, page: null });
  }

  protected exportCsv(): void {
    this.exporting.set(true);
    this.leadsApi
      .exportCsv(this.filters())
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ blob, filename }) => downloadBlob(blob, filename),
        error: (error: unknown) =>
          this.notifier.error(error, { fallback: 'No se pudo exportar el CSV.' }),
      });
  }

  private navigate(queryParams: QueryParams): void {
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
