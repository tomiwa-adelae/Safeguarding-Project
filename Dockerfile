# ═══════════════════════════════════════════════════════════════
# Project STAR Safeguarding Course — Production Dockerfile
# ═══════════════════════════════════════════════════════════════
# Multi-stage build for a lean, secure production image.
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Dependency installation ────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy lockfiles first for optimal layer caching
COPY package.json package-lock.json ./

# Install only production dependencies using the lockfile (deterministic)
RUN npm ci --omit=dev && npm cache clean --force


# ── Stage 2: Production runtime ─────────────────────────────────
FROM node:20-alpine AS runner

# Install dumb-init: proper PID 1 signal handling (graceful shutdown)
# Install wget: used by the Docker HEALTHCHECK
RUN apk add --no-cache dumb-init wget

# Create a non-root user/group for security — never run as root in production
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copy production node_modules from the deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source (chown sets correct ownership in one layer)
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck: verify the app is responding on port 3000
# --start-period gives the app time to connect to the DB on cold start
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# dumb-init wraps node so SIGTERM/SIGINT are forwarded correctly,
# enabling the graceful shutdown handler already in server.js
CMD ["dumb-init", "node", "server.js"]
