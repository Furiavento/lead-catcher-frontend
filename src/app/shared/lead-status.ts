import { Component, computed, input } from '@angular/core';
import { LEAD_STATUSES, LeadStatus } from '../core/api/models';

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  converted: 'Convertido',
  lost: 'Perdido',
};

export const STATUS_OPTIONS = LEAD_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

@Component({
  selector: 'app-status-badge',
  template: `{{ label() }}`,
  host: {
    class: 'status-badge',
    '[class]': "'status-' + status()",
  },
})
export class StatusBadge {
  readonly status = input.required<LeadStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}
