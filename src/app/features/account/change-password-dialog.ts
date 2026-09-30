import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { hasStatus } from '../../core/http/error-message';
import { Notifier } from '../../shared/notifier';

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar contraseña</h2>
    <form [formRoot]="passwordForm" novalidate>
      <mat-dialog-content>
        <p class="hint">
          Las sesiones abiertas en otros dispositivos seguirán activas hasta que caduquen.
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Contraseña actual</mat-label>
          <input
            matInput
            type="password"
            autocomplete="current-password"
            [formField]="passwordForm.currentPassword"
          />
          @if (passwordForm.currentPassword().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nueva contraseña</mat-label>
          <input
            matInput
            type="password"
            autocomplete="new-password"
            [formField]="passwordForm.newPassword"
          />
          <mat-hint>Mínimo 12 caracteres</mat-hint>
          @if (passwordForm.newPassword().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Repite la nueva contraseña</mat-label>
          <input
            matInput
            type="password"
            autocomplete="new-password"
            [formField]="passwordForm.confirmPassword"
          />
          @if (passwordForm.confirmPassword().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="passwordForm().submitting()">
          Guardar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 420px;
    }
    .hint {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class ChangePasswordDialog {
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialog, boolean>);
  private readonly notifier = inject(Notifier);

  protected readonly model = signal({ currentPassword: '', newPassword: '', confirmPassword: '' });
  protected readonly passwordForm = form(
    this.model,
    (path) => {
      required(path.currentPassword, { message: 'Introduce tu contraseña actual' });
      required(path.newPassword, { message: 'Introduce la nueva contraseña' });
      minLength(path.newPassword, 12, { message: 'Debe tener al menos 12 caracteres' });
      maxLength(path.newPassword, 256, { message: 'Máximo 256 caracteres' });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() === valueOf(path.newPassword)
          ? undefined
          : { kind: 'mismatch', message: 'Las contraseñas no coinciden' },
      );
    },
    {
      submission: {
        action: async (field) => {
          const { currentPassword, newPassword } = field().value();
          try {
            await firstValueFrom(this.auth.changePassword(currentPassword, newPassword));
          } catch (error) {
            if (hasStatus(error, 400)) {
              return {
                kind: 'wrongPassword',
                message: 'La contraseña actual no es correcta.',
                fieldTree: field.currentPassword,
              };
            }
            this.notifier.error(error);
            return undefined;
          }
          this.dialogRef.close(true);
          return undefined;
        },
      },
    },
  );
}
