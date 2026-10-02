import { Clipboard } from '@angular/cdk/clipboard';
import { Component, DOCUMENT, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AppConfigService } from '../../core/config/app-config.service';
import { Notifier } from '../../shared/notifier';
import { apiExample, embedSnippet, formUrl } from './snippets';

/** How to connect a website: link, embeddable form and API. */
@Component({
  selector: 'app-integration-page',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './integration.page.html',
  styleUrl: './integration.page.css',
})
export class IntegrationPage {
  private readonly clipboard = inject(Clipboard);
  private readonly notifier = inject(Notifier);
  private readonly config = inject(AppConfigService);
  private readonly origin = inject(DOCUMENT).location?.origin ?? '';

  protected readonly source = signal('web');
  protected readonly privacyPolicyUrl = this.config.privacyPolicyUrl;
  protected readonly url = computed(() => formUrl(this.origin, this.source()));
  protected readonly embed = computed(() => embedSnippet(this.url()));
  protected readonly api = computed(() => apiExample(this.config.apiUrl(), this.source()));

  protected copy(text: string, what: string): void {
    if (this.clipboard.copy(text)) {
      this.notifier.success(`${what} copiado`);
    } else {
      this.notifier.error(null, { fallback: 'No se pudo copiar. Selecciona el texto a mano.' });
    }
  }
}
