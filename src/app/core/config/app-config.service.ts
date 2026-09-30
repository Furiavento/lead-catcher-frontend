import { HttpBackend, HttpClient } from '@angular/common/http';
import { PLATFORM_ID, Service, inject, isDevMode, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

interface RuntimeConfig {
  apiUrl: string;
}

const DEFAULT_API_URL = 'http://localhost:3000/api';

/** Loads `/config.json`, served by the SSR server from its environment. */
@Service()
export class AppConfigService {
  // HttpBackend skips the interceptors (the auth one needs this config).
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _apiUrl = signal(DEFAULT_API_URL);

  readonly apiUrl = this._apiUrl.asReadonly();

  /** Absolute URL of an API path, e.g. `api('/leads')`. */
  api(path: `/${string}`): string {
    return this._apiUrl() + path;
  }

  /** Whether a request targets the API (and should carry the token). */
  isApiUrl(url: string): boolean {
    const base = this._apiUrl();
    return url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`);
  }

  async load(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const config = await firstValueFrom(this.http.get<RuntimeConfig>('/config.json'));
      if (config.apiUrl) this._apiUrl.set(config.apiUrl.replace(/\/+$/, ''));
    } catch (error) {
      if (isDevMode()) console.warn('Could not load /config.json, using default API URL', error);
    }
  }
}
