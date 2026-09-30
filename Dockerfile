# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The SSR server bundle is self-contained: no node_modules needed at runtime.
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app
COPY --chown=node:node --from=build /app/dist/lead-catcher-frontend ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/config.json" || exit 1
CMD ["node", "dist/server/server.mjs"]
