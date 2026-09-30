import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { errorMessage } from '../core/http/error-message';

/** Inline error for a failed load, with a retry button. Renders nothing without an error. */
@Component({
  selector: 'app-error-banner',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (message(); as text) {
      <div class="error-banner" role="alert">
        <mat-icon aria-hidden="true">error</mat-icon>
        <span>{{ text }}</span>
        <button mat-button type="button" (click)="retry.emit()">Reintentar</button>
      </div>
    }
  `,
  styles: `
    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    span {
      flex: 1;
    }
  `,
})
export class ErrorBanner {
  readonly error = input<unknown>();
  readonly fallback = input<string>();
  readonly retry = output();

  protected readonly message = computed(() =>
    this.error() ? errorMessage(this.error(), { fallback: this.fallback() }) : null,
  );
}
