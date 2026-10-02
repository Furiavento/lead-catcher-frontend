import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { runtimeConfigFromEnv } from './app/core/config/runtime-config';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Runtime configuration for the browser. API_URL is read on every request so
 * the same image works in any environment (Dokploy only needs a restart).
 */
app.get('/config.json', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(runtimeConfigFromEnv(process.env));
});

/**
 * Only the public lead form (/f/...) can be embedded in an iframe, by the
 * origins in FORM_FRAME_ANCESTORS (comma-separated, any by default). The admin
 * panel can't be framed, which prevents clickjacking.
 */
const formFrameAncestors =
  (process.env['FORM_FRAME_ANCESTORS'] ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .join(' ') || '*';

app.use((req, res, next) => {
  if (req.path.startsWith('/f/')) {
    res.set('Content-Security-Policy', `frame-ancestors ${formFrameAncestors}`);
  } else {
    res.set('Content-Security-Policy', "frame-ancestors 'none'");
    res.set('X-Frame-Options', 'DENY');
  }
  next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  // Node as PID 1 in Docker ignores SIGTERM unless handled, so Dokploy would
  // wait for the timeout and kill the container.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => server.close(() => process.exit(0)));
  }
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
