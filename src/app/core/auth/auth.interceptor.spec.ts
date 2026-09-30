import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const token =
    'header.' + btoa(JSON.stringify({ sub: '1', exp: Date.now() / 1000 + 3600 })) + '.sig';

  beforeEach(() => {
    localStorage.setItem('lead-catcher.token', token);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  it('adds the bearer token to API requests only', () => {
    http.get('http://localhost:3000/api/leads').subscribe();
    http.get('/config.json').subscribe();

    expect(
      controller.expectOne('http://localhost:3000/api/leads').request.headers.get('Authorization'),
    ).toBe(`Bearer ${token}`);
    expect(controller.expectOne('/config.json').request.headers.has('Authorization')).toBe(false);
  });

  it('logs out when the API answers 401', () => {
    const auth = TestBed.inject(AuthService);
    http.get('http://localhost:3000/api/leads').subscribe({ error: () => undefined });
    controller
      .expectOne('http://localhost:3000/api/leads')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull();
  });

  it('logs out only once when parallel requests get 401', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    http.get('http://localhost:3000/api/leads').subscribe({ error: () => undefined });
    http.get('http://localhost:3000/api/leads/stats').subscribe({ error: () => undefined });
    for (const url of [
      'http://localhost:3000/api/leads',
      'http://localhost:3000/api/leads/stats',
    ]) {
      controller.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('does not send the token to other hosts sharing the API prefix', () => {
    http.get('http://localhost:3000/api-other/leads').subscribe();
    expect(
      controller
        .expectOne('http://localhost:3000/api-other/leads')
        .request.headers.has('Authorization'),
    ).toBe(false);
  });
});
