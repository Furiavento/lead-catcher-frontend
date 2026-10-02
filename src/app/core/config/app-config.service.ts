import { HttpBackend, HttpClient } from '@angular/common/http';
import {
  PLATFORM_ID,
  Service,
  TransferState,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_API_URL,
  RUNTIME_CONFIG_KEY,
  RuntimeConfig,
  SERVER_RUNTIME_CONFIG,
} from './runtime-config';

/**
 * Runtime config. On the server it comes from the environment; in the browser
 * from the server-rendered page (TransferState) or, for client-rendered
 * routes, from `/config.json`.
 */
@Service()
export class AppConfigService {
  // HttpBackend skips the interceptors (the auth one needs this config).
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly transferState = inject(TransferState);
  private readonly config = signal<RuntimeConfig>(
    inject(SERVER_RUNTIME_CONFIG, { optional: true }) ?? { apiUrl: DEFAULT_API_URL },
  );

  readonly apiUrl = computed(() => this.config().apiUrl);
  readonly privacyPolicyUrl = computed(() => this.config().privacyPolicyUrl);
  readonly privacyPolicyVersion = computed(() => this.config().privacyPolicyVersion);

  /** Absolute URL of an API path, e.g. `api('/leads')`. */
  api(path: `/${string}`): string {
    return this.apiUrl() + path;
  }

  /** Whether a request targets the API (and should carry the token). */
  isApiUrl(url: string): boolean {
    const base = this.apiUrl();
    return url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`);
  }

  async load(): Promise<void> {
    if (!this.isBrowser) {
      this.transferState.set(RUNTIME_CONFIG_KEY, this.config());
      return;
    }
    const rendered = this.transferState.get(RUNTIME_CONFIG_KEY, null);
    if (rendered) {
      this.config.set(rendered);
      return;
    }
    try {
      const loaded = await firstValueFrom(this.http.get<Partial<RuntimeConfig>>('/config.json'));
      this.config.set({
        ...loaded,
        apiUrl: loaded.apiUrl ? loaded.apiUrl.replace(/\/+$/, '') : DEFAULT_API_URL,
      });
    } catch (error) {
      if (isDevMode()) console.warn('Could not load /config.json, using default API URL', error);
    }
  }
}
