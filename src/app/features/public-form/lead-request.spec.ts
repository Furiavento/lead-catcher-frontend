import { LeadFormValue, toLeadRequest } from './lead-request';

const value: LeadFormValue = {
  name: '  Ana  ',
  email: ' ana@example.com ',
  phone: '',
  company: 'ACME',
  message: '',
  consent: true,
  website: '',
};

describe('toLeadRequest', () => {
  it('trims values and drops empty ones', () => {
    expect(toLeadRequest(value, { source: 'landing' })).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      company: 'ACME',
      source: 'landing',
      consent: true,
    });
  });

  it('truncates query values to the API limits', () => {
    const lead = toLeadRequest(value, { source: 'x'.repeat(150), utmCampaign: 'y'.repeat(300) });
    expect(lead.source).toHaveLength(100);
    expect(lead.utmCampaign).toHaveLength(200);
  });

  it('prefers the landing parameter and falls back to the referrer', () => {
    expect(
      toLeadRequest(value, { landing: 'https://a.com/p', referrer: 'https://b.com/' }).landingUrl,
    ).toBe('https://a.com/p');
    expect(toLeadRequest(value, { landing: 'nope', referrer: 'https://b.com/' }).landingUrl).toBe(
      'https://b.com/',
    );
  });

  it('ignores URLs the API would reject', () => {
    expect(toLeadRequest(value, { landing: 'javascript:alert(1)' }).landingUrl).toBeUndefined();
    expect(
      toLeadRequest(value, { landing: `https://a.com/${'x'.repeat(2000)}` }).landingUrl,
    ).toBeUndefined();
  });
});
