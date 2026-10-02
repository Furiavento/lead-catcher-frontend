import { CreateLeadRequest } from '../../core/api/models';

/** What the visitor types in the form. */
export interface LeadFormValue {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  consent: boolean;
  /** Honeypot: hidden from people, so only bots fill it. */
  website: string;
}

/** Where the visit comes from: route, query string and page. */
export interface CaptureContext {
  source?: string;
  /** Page the form is embedded in, passed by the embed snippet. */
  landing?: string;
  /** `document.referrer`, used when there is no `landing`. */
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  privacyPolicyVersion?: string;
}

const MAX_URL_LENGTH = 2000;

/**
 * Trims and truncates to the API's limit. The values come from URLs anyone can
 * edit, and one too long would make the API reject the whole lead.
 */
function clip(value: string | undefined, max: number): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

/** An http(s) URL the API accepts, or undefined. */
function httpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const valid = /^https?:$/.test(url.protocol) && url.href.length <= MAX_URL_LENGTH;
    return valid ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Builds the body of `POST /leads`, dropping empty and invalid values. */
export function toLeadRequest(value: LeadFormValue, context: CaptureContext): CreateLeadRequest {
  return {
    name: value.name.trim(),
    email: value.email.trim(),
    phone: clip(value.phone, 50),
    company: clip(value.company, 200),
    message: clip(value.message, 5000),
    source: clip(context.source, 100),
    landingUrl: httpUrl(context.landing) ?? httpUrl(context.referrer),
    utmSource: clip(context.utmSource, 200),
    utmMedium: clip(context.utmMedium, 200),
    utmCampaign: clip(context.utmCampaign, 200),
    utmTerm: clip(context.utmTerm, 200),
    utmContent: clip(context.utmContent, 200),
    consent: true,
    privacyPolicyVersion: clip(context.privacyPolicyVersion, 50),
    website: clip(value.website, 500),
  };
}
