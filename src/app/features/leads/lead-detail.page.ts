import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, filter, finalize, firstValueFrom, switchMap } from 'rxjs';
import { LeadsApi } from '../../core/api/leads-api.service';
import { NotesApi } from '../../core/api/notes-api.service';
import { Lead, LeadNote, LeadStatus } from '../../core/api/models';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog';
import { ErrorBanner } from '../../shared/error-banner';
import { STATUS_OPTIONS, StatusBadge } from '../../shared/lead-status';
import { Notifier } from '../../shared/notifier';
import { LeadEditDialog } from './lead-edit-dialog';

@Component({
  selector: 'app-lead-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    ErrorBanner,
    StatusBadge,
  ],
  templateUrl: './lead-detail.page.html',
  styleUrl: './lead-detail.page.css',
})
export class LeadDetailPage {
  private readonly leadsApi = inject(LeadsApi);
  private readonly notesApi = inject(NotesApi);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /** Route param, bound by the router. */
  readonly id = input.required<string>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly savingStatus = signal(false);

  protected readonly lead = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.leadsApi.get(params),
  });

  protected readonly notes = computed(() =>
    [...(this.lead.value()?.notes ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  protected readonly utm = computed(() => {
    const lead = this.lead.value();
    if (!lead) return [];
    return [
      { label: 'utm_source', value: lead.utmSource },
      { label: 'utm_medium', value: lead.utmMedium },
      { label: 'utm_campaign', value: lead.utmCampaign },
      { label: 'utm_term', value: lead.utmTerm },
      { label: 'utm_content', value: lead.utmContent },
    ].filter((item) => item.value);
  });

  protected readonly noteModel = signal({ body: '' });
  protected readonly noteForm = form(
    this.noteModel,
    (path) => {
      required(path.body, { message: 'Escribe la nota' });
      maxLength(path.body, 5000, { message: 'Máximo 5000 caracteres' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            const note = await firstValueFrom(
              this.notesApi.create(this.id(), field.body().value().trim()),
            );
            this.patchNotes((notes) => [...notes, note]);
            field().reset({ body: '' });
          } catch (error) {
            this.notifier.error(error, { fallback: 'No se pudo guardar la nota.' });
          }
          return undefined;
        },
      },
    },
  );

  // Actions use RxJS, cancelled if the page is left; forms use promises
  // because that is what Signal Forms submission expects.

  protected changeStatus(status: LeadStatus): void {
    const lead = this.lead.value();
    if (!lead || lead.status === status) return;
    this.savingStatus.set(true);
    this.leadsApi
      .update(lead.id, { status })
      .pipe(
        finalize(() => {
          this.savingStatus.set(false);
          // On success it brings the automatic system note; on error it
          // restores the previous status in the select.
          this.lead.reload();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.notifier.success('Estado actualizado'),
        error: (error: unknown) =>
          this.notifier.error(error, { fallback: 'No se pudo cambiar el estado.' }),
      });
  }

  protected edit(): void {
    const lead = this.lead.value();
    if (!lead) return;
    this.dialog
      .open<LeadEditDialog, Lead, Lead>(LeadEditDialog, { data: lead })
      .afterClosed()
      .pipe(
        filter((updated): updated is Lead => !!updated),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.lead.value.update((current) => current && { ...current, ...updated });
        this.notifier.success('Contacto actualizado');
      });
  }

  protected remove(): void {
    const lead = this.lead.value();
    if (!lead) return;
    this.confirm({
      title: 'Eliminar lead',
      message: `Se eliminará a ${lead.name} (${lead.email}) y todas sus notas. Esta acción no se puede deshacer.`,
    })
      .pipe(
        switchMap(() => this.leadsApi.remove(lead.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notifier.success('Lead eliminado');
          void this.router.navigate(['/leads']);
        },
        error: (error: unknown) =>
          this.notifier.error(error, { fallback: 'No se pudo eliminar el lead.' }),
      });
  }

  protected removeNote(note: LeadNote): void {
    this.confirm({ title: 'Eliminar nota', message: '¿Seguro que quieres eliminar esta nota?' })
      .pipe(
        switchMap(() => this.notesApi.remove(this.id(), note.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.patchNotes((notes) => notes.filter((n) => n.id !== note.id));
          this.notifier.success('Nota eliminada');
        },
        error: (error: unknown) =>
          this.notifier.error(error, { fallback: 'No se pudo eliminar la nota.' }),
      });
  }

  /** Emits once if the user confirms, completes without emitting otherwise. */
  private confirm(data: ConfirmDialogData): Observable<true> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .pipe(filter((confirmed): confirmed is true => confirmed === true));
  }

  private patchNotes(fn: (notes: LeadNote[]) => LeadNote[]): void {
    this.lead.value.update((current) => current && { ...current, notes: fn(current.notes) });
  }
}
