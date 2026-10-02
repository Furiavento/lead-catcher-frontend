import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadFormPage } from './lead-form.page';

const API = 'http://localhost:3000/api/leads';

describe('LeadFormPage', () => {
  let fixture: ComponentFixture<LeadFormPage>;
  let http: HttpTestingController;
  let element: HTMLElement;

  /** Lets the async submission action finish after a response is flushed. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function fillAndSubmit(): Promise<void> {
    type('#lead-name', 'Ana');
    type('#lead-email', 'ana@example.com');
    element.querySelector<HTMLInputElement>('#lead-consent')!.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LeadFormPage);
    fixture.componentRef.setInput('source', 'landing');
    fixture.componentRef.setInput('utm_campaign', 'verano');
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('does not send the form until consent is given', async () => {
    type('#lead-name', 'Ana');
    type('#lead-email', 'ana@example.com');
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();

    http.expectNone(API);
    expect(element.querySelector('#lead-consent-error')?.textContent).toContain(
      'Debes aceptar la política de privacidad',
    );
  });

  it('sends the lead with its source and UTM, then thanks the visitor', async () => {
    await fillAndSubmit();

    const req = http.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      name: 'Ana',
      email: 'ana@example.com',
      source: 'landing',
      utmCampaign: 'verano',
      consent: true,
    });
    req.flush({ ok: true });
    await settle();

    const heading = element.querySelector('h1');
    expect(heading?.textContent).toContain('¡Gracias!');
    expect(document.activeElement).toBe(heading);
  });

  it('shows the rate limit error and keeps the form', async () => {
    await fillAndSubmit();

    http.expectOne(API).flush(null, { status: 429, statusText: 'Too Many Requests' });
    await settle();

    expect(element.querySelector('[role=alert]')?.textContent).toContain('Demasiados intentos');
    expect(element.querySelector('form')).toBeTruthy();
  });
});
