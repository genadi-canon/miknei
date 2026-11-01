#!/bin/sh
# Build on Vercel. Migrations run only for production deploys, so a PR preview never changes the shared database.
set -e
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
prisma generate
if [ "${VERCEL_ENV:-production}" = "production" ]; then
  if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL is not set: connect a database to the Vercel project" >&2; exit 1; fi
  prisma migrate deploy
else
  echo "Skipping migrations for VERCEL_ENV=$VERCEL_ENV"
fi
next build
