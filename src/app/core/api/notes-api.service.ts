import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { LeadNote } from './models';

@Service()
export class NotesApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  list(leadId: string): Observable<LeadNote[]> {
    return this.http.get<LeadNote[]>(this.config.api(`/leads/${leadId}/notes`));
  }

  create(leadId: string, body: string): Observable<LeadNote> {
    return this.http.post<LeadNote>(this.config.api(`/leads/${leadId}/notes`), { body });
  }

  remove(leadId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(this.config.api(`/leads/${leadId}/notes/${noteId}`));
  }
}
