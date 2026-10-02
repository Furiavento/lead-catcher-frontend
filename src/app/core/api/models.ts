/**
 * API types. They come from `schema.d.ts`, generated from the backend's
 * OpenAPI document with `npm run api:types`; do not edit that file by hand.
 */
import type { components, operations } from './schema';

type Schemas = components['schemas'];

export type Lead = Schemas['LeadDto'];
export type LeadNote = Schemas['LeadNoteDto'];
export type LeadWithNotes = Schemas['LeadWithNotesDto'];
export type LeadPage = Schemas['LeadPageDto'];
export type LeadStats = Schemas['LeadStatsDto'];
export type DailyCount = Schemas['DailyCountDto'];
export type SourceCount = Schemas['SourceCountDto'];
export type UpdateLeadRequest = Schemas['UpdateLeadDto'];
export type CreateLeadRequest = Schemas['CreateLeadDto'];
export type LoginResponse = Schemas['LoginResponseDto'];
export type CurrentUser = Schemas['MeResponseDto'];

export type LeadStatus = Lead['status'];
export type NoteKind = LeadNote['kind'];

export type ListLeadsQuery = NonNullable<operations['LeadsController_list']['parameters']['query']>;
export type LeadFilters = Omit<ListLeadsQuery, 'page' | 'limit'>;
export type StatsQuery = NonNullable<operations['LeadsController_stats']['parameters']['query']>;
export type LeadSort = NonNullable<ListLeadsQuery['sort']>;
export type SortOrder = NonNullable<ListLeadsQuery['order']>;

/**
 * Every status, in pipeline order. A status the API drops fails to compile
 * here; a new one fails in STATUS_LABELS (a Record<LeadStatus, string>).
 */
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const satisfies readonly LeadStatus[];

export const LEAD_SORTS = ['createdAt', 'lastSubmittedAt'] as const satisfies readonly LeadSort[];
export const SORT_ORDERS = ['asc', 'desc'] as const satisfies readonly SortOrder[];

/** API defaults, so the URL can omit them. */
export const DEFAULT_SORT: LeadSort = 'createdAt';
export const DEFAULT_ORDER: SortOrder = 'desc';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
