import { Service, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorMessageOptions, errorMessage } from '../core/http/error-message';

/** Short feedback messages (Material snack bar, announced to screen readers). */
@Service()
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }

  error(error: unknown, options?: ErrorMessageOptions): void {
    this.snackBar.open(errorMessage(error, options), 'Cerrar', {
      duration: 6000,
      politeness: 'assertive',
    });
  }
}
