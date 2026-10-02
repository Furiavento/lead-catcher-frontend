import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SERVER_RUNTIME_CONFIG, runtimeConfigFromEnv } from './core/config/runtime-config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: SERVER_RUNTIME_CONFIG, useFactory: () => runtimeConfigFromEnv(process.env) },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
