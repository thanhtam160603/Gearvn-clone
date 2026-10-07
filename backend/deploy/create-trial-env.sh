#!/usr/bin/env bash
set -euo pipefail

target="${1:-/opt/gearvn/secrets/trial.env}"
if [[ -e "$target" ]]; then
  echo "trial.env already exists; leaving it unchanged" >&2
  exit 1
fi

umask 077
install -d -m 0700 "$(dirname "$target")"
scratch="$(mktemp -d)"
cleanup() {
  rm -f "$scratch/private.pem" "$scratch/public.pem"
  rmdir "$scratch"
}
trap cleanup EXIT

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$scratch/private.pem" 2>/dev/null
openssl pkey -in "$scratch/private.pem" -pubout -out "$scratch/public.pem" 2>/dev/null

escape_pem() {
  awk '{ printf "%s\\n", $0 }' "$1"
}

{
  printf 'FRONTEND_ORIGIN=http://localhost:3000\n'
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'INTERNAL_SERVICE_KEY=%s\n' "$(openssl rand -hex 32)"
  printf 'CART_COOKIE_SECRET=%s\n' "$(openssl rand -hex 32)"
  printf 'JWT_PRIVATE_KEY="%s"\n' "$(escape_pem "$scratch/private.pem")"
  printf 'JWT_PUBLIC_KEY="%s"\n' "$(escape_pem "$scratch/public.pem")"
} > "$target"

chmod 600 "$target"
echo "Created $target (contents not printed)"
