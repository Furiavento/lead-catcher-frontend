import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // The admin panel depends on the JWT stored in the browser, so it is
    // rendered on the client. Public pages can switch to Prerender/Server.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
