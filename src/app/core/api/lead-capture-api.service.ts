import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { CreateLeadRequest } from './models';

/** Public lead capture, used by the form visitors fill in (no login). */
@Service()
export class LeadCaptureApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  /** The API always answers `{ ok: true }`, even for duplicates or bots. */
  capture(lead: CreateLeadRequest): Observable<void> {
    return this.http.post(this.config.api('/leads'), lead).pipe(map(() => undefined));
  }
}
