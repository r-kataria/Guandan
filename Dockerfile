# syntax=docker/dockerfile:1

# ---- build stage: install deps, build the client + bundle the server ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:all   # -> dist/ (static client) and dist-server/index.mjs (bundled server)

# ---- runtime stage: just Node + the build output (no dev toolchain, no node_modules) ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
EXPOSE 8787
USER node
# One Node process serves the static client AND the WebSocket on $PORT.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q -O - "http://127.0.0.1:${PORT}/healthz" || exit 1
CMD ["node", "dist-server/index.mjs"]
