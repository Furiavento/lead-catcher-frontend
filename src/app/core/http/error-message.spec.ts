import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage, hasStatus } from './error-message';

const httpError = (status: number, error: unknown = null) =>
  new HttpErrorResponse({ status, error });

describe('errorMessage', () => {
  it('prefers per-call messages over the defaults', () => {
    expect(errorMessage(httpError(401), { byStatus: { 401: 'Credenciales' } })).toBe(
      'Credenciales',
    );
    expect(errorMessage(httpError(401))).toContain('sesión');
  });

  it('joins validation messages from the API', () => {
    expect(errorMessage(httpError(400, { message: ['email must be an email', 'x'] }))).toBe(
      'email must be an email. x',
    );
  });

  it('falls back for unknown errors', () => {
    expect(errorMessage(new Error('boom'), { fallback: 'Falló' })).toBe('Falló');
    expect(errorMessage(httpError(502))).toContain('servidor');
  });

  it('checks HTTP statuses', () => {
    expect(hasStatus(httpError(409), 409)).toBe(true);
    expect(hasStatus(new Error(), 409)).toBe(false);
  });
});
