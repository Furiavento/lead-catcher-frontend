import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Public lead form: rendered per request so it shows up fast and reads the
    // runtime config (privacy policy) from the server's environment.
    path: 'f/:source',
    renderMode: RenderMode.Server,
  },
  {
    // The admin panel depends on the JWT stored in the browser, so it is
    // rendered on the client. Public pages can switch to Prerender/Server.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
