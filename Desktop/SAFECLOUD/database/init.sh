#!/bin/bash
# Script to initialize the database

set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h db -p 5432 -U postgres; do
  sleep 1
done

echo "Creating database..."
createdb -h db -U postgres safecloud_db 2>/dev/null || true

echo "Creating schema..."
psql -h db -U postgres safecloud_db < /docker-entrypoint-initdb.d/init.sql

echo "Database initialized successfully!"
