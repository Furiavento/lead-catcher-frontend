import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import {
  Lead,
  LeadFilters,
  LeadPage,
  LeadStats,
  LeadWithNotes,
  ListLeadsQuery,
  StatsQuery,
  UpdateLeadRequest,
} from './models';

export interface CsvFile {
  blob: Blob;
  filename: string;
}

type QueryValue = string | number | boolean | null | undefined;

/** Builds query params, dropping empty values. */
function toParams(query: Record<string, QueryValue>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

function filenameFrom(disposition: string | null): string | undefined {
  return disposition?.match(/filename="?([^";]+)"?/)?.[1];
}

@Service()
export class LeadsApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  list(query: ListLeadsQuery): Observable<LeadPage> {
    return this.http.get<LeadPage>(this.config.api('/leads'), { params: toParams(query) });
  }

  stats(query: StatsQuery): Observable<LeadStats> {
    return this.http.get<LeadStats>(this.config.api('/leads/stats'), {
      params: toParams(query),
    });
  }

  get(id: string): Observable<LeadWithNotes> {
    return this.http.get<LeadWithNotes>(this.config.api(`/leads/${id}`));
  }

  update(id: string, changes: UpdateLeadRequest): Observable<Lead> {
    return this.http.patch<Lead>(this.config.api(`/leads/${id}`), changes);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.config.api(`/leads/${id}`));
  }

  exportCsv(filters: LeadFilters): Observable<CsvFile> {
    return this.http
      .get(this.config.api('/leads/export.csv'), {
        params: toParams(filters),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob([], { type: 'text/csv' }),
          filename: filenameFrom(response.headers.get('Content-Disposition')) ?? 'leads.csv',
        })),
      );
  }
}
