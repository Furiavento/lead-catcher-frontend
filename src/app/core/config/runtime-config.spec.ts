import { DEFAULT_API_URL, runtimeConfigFromEnv } from './runtime-config';

describe('runtimeConfigFromEnv', () => {
  it('reads the environment and strips the trailing slash', () => {
    expect(
      runtimeConfigFromEnv({
        API_URL: 'https://api.x/api/',
        PRIVACY_POLICY_URL: 'https://x/privacidad',
        PRIVACY_POLICY_VERSION: '2026-01',
      }),
    ).toEqual({
      apiUrl: 'https://api.x/api',
      privacyPolicyUrl: 'https://x/privacidad',
      privacyPolicyVersion: '2026-01',
    });
  });

  it('uses defaults for missing or empty values', () => {
    expect(runtimeConfigFromEnv({ API_URL: '', PRIVACY_POLICY_URL: '' })).toEqual({
      apiUrl: DEFAULT_API_URL,
      privacyPolicyUrl: undefined,
      privacyPolicyVersion: undefined,
    });
  });
});
