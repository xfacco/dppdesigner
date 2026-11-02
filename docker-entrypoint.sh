#!/bin/sh
# Run database migrations then start the Next.js server
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js..."
exec node server.js
