import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { LeadCaptureApi } from '../../core/api/lead-capture-api.service';
import { AppConfigService } from '../../core/config/app-config.service';
import { errorMessage } from '../../core/http/error-message';
import { HEIGHT_MESSAGE } from './embed';
import { LeadFormValue, toLeadRequest } from './lead-request';

/**
 * Public lead form at `/f/:source`, rendered on the server (fast first paint,
 * also inside an iframe). It uses native inputs instead of Material
 * components to keep its bundle small.
 */
@Component({
  selector: 'app-lead-form-page',
  imports: [FormField, FormRoot],
  templateUrl: './lead-form.page.html',
  styleUrl: './lead-form.page.css',
})
export class LeadFormPage {
  private readonly api = inject(LeadCaptureApi);
  private readonly config = inject(AppConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Bound from the route and the query string by the router. */
  readonly source = input<string>();
  readonly landing = input<string>();
  readonly utmSource = input<string>(undefined, { alias: 'utm_source' });
  readonly utmMedium = input<string>(undefined, { alias: 'utm_medium' });
  readonly utmCampaign = input<string>(undefined, { alias: 'utm_campaign' });
  readonly utmTerm = input<string>(undefined, { alias: 'utm_term' });
  readonly utmContent = input<string>(undefined, { alias: 'utm_content' });

  protected readonly privacyPolicyUrl = this.config.privacyPolicyUrl;

  /**
   * Submitting before hydration would make the browser send the data in the
   * URL (a native GET), so the button stays disabled until the app is ready.
   */
  protected readonly ready = signal(false);
  protected readonly sent = signal(false);
  private readonly sentHeading = viewChild<ElementRef<HTMLElement>>('sentHeading');

  protected readonly model = signal<LeadFormValue>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    consent: false,
    website: '',
  });
  protected readonly leadForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Introduce tu nombre' });
      maxLength(path.name, 200, { message: 'Máximo 200 caracteres' });
      required(path.email, { message: 'Introduce tu email' });
      email(path.email, { message: 'Introduce un email válido' });
      maxLength(path.email, 254, { message: 'Máximo 254 caracteres' });
      maxLength(path.phone, 50, { message: 'Máximo 50 caracteres' });
      maxLength(path.company, 200, { message: 'Máximo 200 caracteres' });
      maxLength(path.message, 5000, { message: 'Máximo 5000 caracteres' });
      validate(path.consent, ({ value }) =>
        value()
          ? undefined
          : { kind: 'consent', message: 'Debes aceptar la política de privacidad' },
      );
    },
    {
      submission: {
        action: async (field) => {
          const lead = toLeadRequest(field().value(), {
            source: this.source(),
            landing: this.landing(),
            referrer: this.document.referrer,
            utmSource: this.utmSource(),
            utmMedium: this.utmMedium(),
            utmCampaign: this.utmCampaign(),
            utmTerm: this.utmTerm(),
            utmContent: this.utmContent(),
            privacyPolicyVersion: this.config.privacyPolicyVersion(),
          });
          try {
            await firstValueFrom(this.api.capture(lead));
          } catch (error) {
            return {
              kind: 'server',
              message: errorMessage(error, {
                fallback: 'No se pudo enviar el formulario. Inténtalo de nuevo.',
                byStatus: { 400: 'Revisa los datos del formulario.' },
              }),
            };
          }
          this.sent.set(true);
          return undefined;
        },
      },
    },
  );

  constructor() {
    // The form is replaced by the confirmation: move focus there so it isn't lost.
    effect(() => this.sentHeading()?.nativeElement.focus());
    afterNextRender(() => {
      this.ready.set(true);
      this.reportHeight();
    });
  }

  /** First error of a field, once the visitor has left it or tried to submit. */
  protected errorOf<T>(field: FieldTree<T>): string | undefined {
    const state = field();
    return state.touched() ? state.errors()[0]?.message : undefined;
  }

  /** Inside an iframe, tells the embedding page the form's height. */
  private reportHeight(): void {
    const view = this.document.defaultView;
    if (!view || view.parent === view || typeof ResizeObserver === 'undefined') return;
    const element = this.host.nativeElement;
    const observer = new ResizeObserver(() =>
      view.parent.postMessage({ type: HEIGHT_MESSAGE, height: element.offsetHeight }, '*'),
    );
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
