import { InjectionToken, makeStateKey } from '@angular/core';

/** Settings that depend on the deployment, not on the build. */
export interface RuntimeConfig {
  /** Public API URL with the `/api` prefix and no trailing slash. */
  apiUrl: string;
  /** Privacy policy linked from the public lead form. */
  privacyPolicyUrl?: string;
  /** Sent with each lead as evidence of which policy was accepted. */
  privacyPolicyVersion?: string;
}

export const DEFAULT_API_URL = 'http://localhost:3000/api';

/** Reads the config from the server's environment (`/config.json` and SSR). */
export function runtimeConfigFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): RuntimeConfig {
  return {
    apiUrl: (env['API_URL'] || DEFAULT_API_URL).replace(/\/+$/, ''),
    privacyPolicyUrl: env['PRIVACY_POLICY_URL'] || undefined,
    privacyPolicyVersion: env['PRIVACY_POLICY_VERSION'] || undefined,
  };
}

/** Provided only on the server (`app.config.server.ts`), where the environment is readable. */
export const SERVER_RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('SERVER_RUNTIME_CONFIG');

/** Hands the config of a server-rendered page to the browser, saving the `/config.json` request. */
export const RUNTIME_CONFIG_KEY = makeStateKey<RuntimeConfig>('runtimeConfig');
