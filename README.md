# Lead Catcher – Frontend

Panel de administración (Angular 22 + Angular Material, SSR con Express) para la API de Lead Catcher.

## Funcionalidades

- **Login** con JWT (guardado en `localStorage`; el logout descarta el token).
- **Resumen**: totales por estado, tasa de conversión, leads por día y principales fuentes para un periodo (7/30/90 días o rango personalizado, agrupado en la zona horaria del navegador).
- **Leads**: búsqueda, filtros por estado/fuente/fecha, orden, paginación en servidor y exportación CSV. Los filtros viven en la URL.
- **Detalle**: datos de contacto, origen/UTM, consentimiento, cambio de estado, edición, borrado y notas.
- **Cambio de contraseña** desde el menú de usuario.

## Desarrollo local

```bash
npm install
npm start            # http://localhost:4200
```

El backend debe estar en `http://localhost:3000` con `CORS_ORIGINS=http://localhost:4200`. Para apuntar a otra API: `API_URL=https://... npm start`.

```bash
npm test             # tests unitarios (Vitest)
npm run build        # build de producción en dist/
npm run api:types    # regenera src/app/core/api/schema.d.ts desde la API local
```

### Tipos de la API

Los tipos (`Lead`, `LeadStats`, filtros…) se generan del OpenAPI del backend con `openapi-typescript` y se exponen con nombres cortos en `core/api/models.ts`. Tras cambiar un DTO en el backend, con este arrancado:

```bash
npm run api:types                                   # usa http://localhost:3000/api/docs-json
API_DOCS_URL=https://api.tudominio.com/api/docs-json npm run api:types
```

Si el cambio rompe algo en el frontend, el build falla. `openapi-typescript` se ejecuta con `npx` en vez de instalarse porque aún declara `typescript@^5` como peer y el proyecto usa TS 6.

## Configuración en runtime

La URL de la API **no se compila** en el bundle: el servidor SSR la expone en `GET /config.json` a partir de sus variables de entorno y la app la carga al arrancar. Una misma imagen sirve para cualquier entorno. Ver `.env.example`:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `4000` en la imagen) |
| `API_URL` | URL **pública** de la API con el prefijo `/api`, p. ej. `https://api.tudominio.com/api`. La llama el navegador, así que no sirve un hostname interno de Docker |
| `NG_ALLOWED_HOSTS` | Dominios (separados por comas) a los que responde el servidor. Protección SSRF de Angular: cualquier otro `Host` recibe un 400 |

> Igual que en el backend: en Dokploy escribe `KEY=value` **sin comillas**.

## Despliegue en Dokploy

Frontend y backend son dos aplicaciones (contenedores) independientes.

1. Crea una aplicación con build type **Dockerfile** apuntando a este repo.
2. En *Environment*:
   ```
   API_URL=https://api.tudominio.com/api
   NG_ALLOWED_HOSTS=panel.tudominio.com
   ```
3. Configura el dominio (`panel.tudominio.com`) con el puerto `4000`.
4. En el **backend**, añade el dominio del frontend a `CORS_ORIGINS` (p. ej. `CORS_ORIGINS=https://panel.tudominio.com`) y reinícialo.

La imagen solo contiene `dist/` (el bundle del servidor no necesita `node_modules`), corre como usuario `node` e incluye un healthcheck sobre `/config.json`.

## Estructura

```
src/app/
  core/       config runtime, auth (servicio, interceptor, guards), clientes de la API
  shared/     estado del lead, diálogos, banner de error, notificaciones, fechas, descargas
  features/   login, layout (shell), dashboard, leads, account
```

Todas las rutas se renderizan en cliente (`RenderMode.Client`), ya que dependen del token del navegador. Un futuro formulario público puede usar `Prerender` o `Server` en `app.routes.server.ts`.
