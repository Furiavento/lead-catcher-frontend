import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { AuthService } from './auth.service';

/** Sends the JWT to the API only, and logs out when the API rejects it. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const config = inject(AppConfigService);

  if (!config.isApiUrl(req.url) || req.url === config.api('/auth/login')) return next(req);

  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      // Only the first rejected request logs out: parallel requests sent
      // with the same token find it already cleared.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        auth.token() === token
      ) {
        auth.logout(router.url);
      }
      return throwError(() => error);
    }),
  );
};
