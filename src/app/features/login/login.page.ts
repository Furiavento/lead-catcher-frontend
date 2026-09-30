import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { hasStatus } from '../../core/http/error-message';
import { Notifier } from '../../shared/notifier';

@Component({
  selector: 'app-login-page',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the query string by the router. */
  readonly returnUrl = input<string>();

  private readonly notifier = inject(Notifier);

  protected readonly hidePassword = signal(true);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Introduce tu email' });
      email(path.email, { message: 'Introduce un email válido' });
      required(path.password, { message: 'Introduce tu contraseña' });
    },
    {
      submission: {
        // Wrong credentials become a form error (cleared when the user edits);
        // anything else is reported without blocking a retry.
        action: async (field) => {
          const { email, password } = field().value();
          try {
            await firstValueFrom(this.auth.login(email.trim(), password));
          } catch (error) {
            if (hasStatus(error, 401)) {
              return { kind: 'credentials', message: 'Email o contraseña incorrectos.' };
            }
            this.notifier.error(error);
            return undefined;
          }
          const target = this.returnUrl();
          await this.router.navigateByUrl(target?.startsWith('/') ? target : '/dashboard');
          return undefined;
        },
      },
    },
  );
}
