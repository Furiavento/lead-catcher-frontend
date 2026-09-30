import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, maxLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { LeadsApi } from '../../core/api/leads-api.service';
import { Lead, UpdateLeadRequest } from '../../core/api/models';
import { hasStatus } from '../../core/http/error-message';
import { Notifier } from '../../shared/notifier';

const CANNOT_CLEAR = 'No se puede dejar vacío una vez guardado';

type ContactFields = Pick<UpdateLeadRequest, 'name' | 'email' | 'phone' | 'company'>;

/** Only the fields that changed, so the PATCH doesn't rewrite the rest. */
function changedFields(lead: Lead, value: Required<ContactFields>): ContactFields {
  const changes: ContactFields = {};
  for (const key of ['name', 'email', 'phone', 'company'] as const) {
    const next = value[key].trim();
    if (next !== (lead[key] ?? '')) changes[key] = next;
  }
  return changes;
}

@Component({
  selector: 'app-lead-edit-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar contacto</h2>
    <form [formRoot]="leadForm" novalidate>
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput autocomplete="off" [formField]="leadForm.name" />
          @if (leadForm.name().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" autocomplete="off" [formField]="leadForm.email" />
          @if (leadForm.email().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput type="tel" autocomplete="off" [formField]="leadForm.phone" />
          @if (leadForm.phone().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Empresa</mat-label>
          <input matInput autocomplete="off" [formField]="leadForm.company" />
          @if (leadForm.company().errors()[0]; as err) {
            <mat-error>{{ err.message }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="leadForm().submitting()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: min(420px, 80vw);
    }
  `,
})
export class LeadEditDialog {
  private readonly leadsApi = inject(LeadsApi);
  private readonly dialogRef = inject(MatDialogRef<LeadEditDialog, Lead>);
  private readonly lead = inject<Lead>(MAT_DIALOG_DATA);

  private readonly notifier = inject(Notifier);

  protected readonly model = signal({
    name: this.lead.name,
    email: this.lead.email,
    phone: this.lead.phone ?? '',
    company: this.lead.company ?? '',
  });
  protected readonly leadForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'El nombre es obligatorio' });
      maxLength(path.name, 200, { message: 'Máximo 200 caracteres' });
      required(path.email, { message: 'El email es obligatorio' });
      email(path.email, { message: 'Introduce un email válido' });
      maxLength(path.email, 254, { message: 'Máximo 254 caracteres' });
      maxLength(path.phone, 50, { message: 'Máximo 50 caracteres' });
      maxLength(path.company, 200, { message: 'Máximo 200 caracteres' });
      // The API ignores empty values, so a field that has one can't be cleared.
      required(path.phone, { when: () => !!this.lead.phone, message: CANNOT_CLEAR });
      required(path.company, { when: () => !!this.lead.company, message: CANNOT_CLEAR });
    },
    {
      submission: {
        action: async (field) => {
          const changes = changedFields(this.lead, field().value());
          if (!Object.keys(changes).length) {
            this.dialogRef.close();
            return undefined;
          }
          try {
            this.dialogRef.close(await firstValueFrom(this.leadsApi.update(this.lead.id, changes)));
          } catch (error) {
            if (hasStatus(error, 409)) {
              return {
                kind: 'emailTaken',
                message: 'Ya existe otro lead con ese email.',
                fieldTree: field.email,
              };
            }
            this.notifier.error(error);
          }
          return undefined;
        },
      },
    },
  );
}
