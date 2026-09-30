import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID, Service, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { CurrentUser, LoginResponse } from '../api/models';

const TOKEN_KEY = 'lead-catcher.token';

interface JwtClaims {
  sub?: string;
  email?: string;
  exp?: number;
}

/** Reads the payload of a JWT without verifying it (the API does that). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      Array.from(atob(base64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

function expiresAt(token: string): number | null {
  const exp = decodeJwt(token)?.exp;
  return exp === undefined ? null : exp * 1000;
}

function isExpired(token: string, now = Date.now()): boolean {
  const expiry = expiresAt(token);
  return expiry !== null && expiry <= now;
}

/** setTimeout overflows above ~24.8 days; longer sessions rely on the API's 401. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Keeps the JWT in localStorage. The API does not revoke tokens, so logging
 * out just drops it. An expired token is dropped when the app starts or when
 * its expiry time is reached, so `isAuthenticated` stays a pure read.
 */
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(AppConfigService);
  private readonly storage = isPlatformBrowser(inject(PLATFORM_ID)) ? localStorage : null;

  private readonly _token = signal<string | null>(this.readToken());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly user = computed<CurrentUser | null>(() => {
    const token = this._token();
    const claims = token ? decodeJwt(token) : null;
    return claims?.sub && claims.email ? { id: claims.sub, email: claims.email } : null;
  });

  constructor() {
    effect((onCleanup) => {
      const token = this._token();
      const expiry = token && this.storage ? expiresAt(token) : null;
      if (expiry === null) return;
      const delay = expiry - Date.now();
      if (delay > MAX_TIMEOUT_MS) return;
      const timer = setTimeout(() => this.logout(this.router.url), Math.max(0, delay));
      onCleanup(() => clearTimeout(timer));
    });
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(this.config.api('/auth/login'), { email, password }).pipe(
      tap(({ accessToken }) => {
        this.storage?.setItem(TOKEN_KEY, accessToken);
        this._token.set(accessToken);
      }),
      map(() => undefined),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(this.config.api('/auth/password'), {
      currentPassword,
      newPassword,
    });
  }

  logout(returnUrl?: string): void {
    this.storage?.removeItem(TOKEN_KEY);
    this._token.set(null);
    void this.router.navigate(['/login'], {
      queryParams: returnUrl && returnUrl !== '/login' ? { returnUrl } : undefined,
    });
  }

  private readToken(): string | null {
    const token = this.storage?.getItem(TOKEN_KEY) ?? null;
    if (token && isExpired(token)) {
      this.storage?.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  }
}
