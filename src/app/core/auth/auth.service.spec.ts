import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService, decodeJwt } from './auth.service';

function fakeJwt(claims: object): string {
  const encode = (value: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('decodes the JWT payload', () => {
    expect(decodeJwt(fakeJwt({ sub: '1', email: 'ñ@x.com' }))).toEqual({
      sub: '1',
      email: 'ñ@x.com',
    });
    expect(decodeJwt('not-a-jwt')).toBeNull();
  });

  it('stores the token on login and exposes the user', () => {
    const auth = TestBed.inject(AuthService);
    const token = fakeJwt({ sub: 'u1', email: 'admin@example.com', exp: Date.now() / 1000 + 3600 });

    auth.login('admin@example.com', 'secret').subscribe();
    const req = http.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.body).toEqual({ email: 'admin@example.com', password: 'secret' });
    req.flush({ accessToken: token, expiresIn: '8h' });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()).toEqual({ id: 'u1', email: 'admin@example.com' });
    expect(localStorage.getItem('lead-catcher.token')).toBe(token);
  });

  it('ignores an expired stored token', () => {
    localStorage.setItem('lead-catcher.token', fakeJwt({ sub: 'u1', exp: Date.now() / 1000 - 10 }));
    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logs out when the token expires', () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem(
        'lead-catcher.token',
        fakeJwt({ sub: 'u1', exp: Date.now() / 1000 + 60 }),
      );
      const auth = TestBed.inject(AuthService);
      TestBed.tick();
      expect(auth.isAuthenticated()).toBe(true);
      vi.advanceTimersByTime(61_000);
      expect(auth.isAuthenticated()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the token on logout', () => {
    localStorage.setItem('lead-catcher.token', fakeJwt({ sub: 'u1', exp: Date.now() / 1000 + 60 }));
    const auth = TestBed.inject(AuthService);
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('lead-catcher.token')).toBeNull();
  });
});
