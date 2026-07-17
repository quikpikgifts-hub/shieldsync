# Multi-stage build: the final image contains only production dependencies and compiled
# output, not the TypeScript source, dev dependencies, or build toolchain.

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Never run the app as root inside the container.
RUN addgroup -S ember && adduser -S ember -G ember

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

USER ember
EXPOSE 3001

# Uses Node's built-in fetch rather than adding curl/wget to the image — one less package
# to patch. /live deliberately has no dependency checks (see src/health/health.controller.ts),
# so this only answers "is the process itself up," matching Docker's own HEALTHCHECK
# semantics (container-level liveness, not a full readiness check).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
