#!/bin/sh
# Build on Vercel. Migrations run only for production deploys, so a PR preview never changes the shared database.
set -e
# Vercel's database integrations name the connection string differently (Prisma Postgres: POSTGRES_URL).
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_URL:-$DATABASE_URL_POOLED}}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}}"
prisma generate
if [ "${VERCEL_ENV:-production}" = "production" ]; then
  if [ -z "$DATABASE_URL" ]; then echo "No database URL (DATABASE_URL or POSTGRES_URL): connect a database to the Vercel project" >&2; exit 1; fi
  prisma migrate deploy
else
  echo "Skipping migrations for VERCEL_ENV=$VERCEL_ENV"
fi
next build
