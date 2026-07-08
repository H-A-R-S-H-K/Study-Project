# ── Build stage: compile TypeScript → dist ──────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage: prod deps + compiled output only ─────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Tools for the container healthcheck.
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 5000
# Run as the built-in non-root user.
USER node
CMD ["node", "dist/server.js"]
