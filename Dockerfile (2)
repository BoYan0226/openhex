# NOTE: Next.js is built in CI (build-landing job) before this Dockerfile
# runs. This Dockerfile only copies the pre-built standalone output —
# no pnpm install needed.
ARG BASE_IMAGE=node:22-alpine
FROM ${BASE_IMAGE} AS runner

# Use Aliyun Alpine mirror
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built Next.js standalone output (produced by CI build-landing job).
# Preserve the monorepo directory structure so pnpm symlinks resolve correctly.
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./landing/.next/static
COPY --chown=nextjs:nodejs public ./landing/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "landing/server.js"]
