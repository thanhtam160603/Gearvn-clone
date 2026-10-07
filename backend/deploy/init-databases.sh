#!/bin/sh
set -eu

for database in identity_db catalog_db cart_db order_db chat_db; do
  if ! psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '$database'" | grep -q 1; then
    createdb --username "$POSTGRES_USER" "$database"
  fi
done
