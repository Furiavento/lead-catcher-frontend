import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LeadsApi } from './leads-api.service';

describe('LeadsApi', () => {
  let api: LeadsApi;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LeadsApi);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('sends only non-empty filters', () => {
    api.list({ q: 'ana', status: undefined, source: '', page: 2, limit: 20 }).subscribe();
    const req = controller.expectOne((r) => r.url === 'http://localhost:3000/api/leads');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page', 'q']);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 0 } });
  });

  it('reads the CSV file name from Content-Disposition', () => {
    let filename = '';
    api.exportCsv({ status: 'new' }).subscribe((file) => (filename = file.filename));
    controller
      .expectOne((r) => r.url === 'http://localhost:3000/api/leads/export.csv')
      .flush(new Blob(['id\n']), {
        headers: { 'Content-Disposition': 'attachment; filename="leads-2026-09-30.csv"' },
      });
    expect(filename).toBe('leads-2026-09-30.csv');
  });
});
