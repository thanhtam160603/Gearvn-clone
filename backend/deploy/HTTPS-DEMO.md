# Demo HTTPS: Vercel frontend + VPS backend

This setup uses the existing VPS IP `167.172.73.163` and the free DNS name
`api.167-172-73-163.sslip.io`. Check the IP before using the Caddyfile. The
Gateway stays bound to `127.0.0.1:4000`; only Caddy receives public traffic.

Browser REST requests use `/api` on the Vercel frontend. Next.js rewrites them
to the HTTPS API, keeping the existing `SameSite=Lax` refresh/cart cookies on
the frontend host. Chat connects directly to `wss://api.167-172-73-163.sslip.io/chat`.

## 1. Publish the repository changes

The frontend must be committed in `frontend/` before importing the GitHub repo
into Vercel. This workspace currently has a local move from the repository root
into `frontend/`; review that move before committing it. Publish
`frontend/next.config.ts`, `frontend/src/lib/chat-socket.ts`, and
`backend/deploy/Caddyfile.demo` together with the frontend move. Never commit
`frontend/.env.local`, `backend/apps/*/.env`, SSH keys, or database dumps.

On the VPS, pull the resulting commit into `/opt/gearvn`.

## 2. Give the API HTTPS on the VPS

From the VPS terminal, confirm the DNS name resolves to the VPS:

```bash
getent ahostsv4 api.167-172-73-163.sslip.io
curl -fsS 'http://127.0.0.1:4000/api/products?pageSize=1' >/dev/null && echo 'Gateway OK'
```

The DNS output should contain `167.172.73.163`. Make sure inbound TCP 80 and
443 are allowed in both the VPS firewall and the DigitalOcean cloud firewall.
Install Caddy using its official Ubuntu package:

```bash
sudo apt install --yes debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install --yes caddy
```

If `/etc/caddy/Caddyfile` already hosts another site, add the demo site block
instead of replacing that file. Otherwise:

```bash
sudo install -m 644 /opt/gearvn/backend/deploy/Caddyfile.demo /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -fsS 'https://api.167-172-73-163.sslip.io/api/products?pageSize=1' >/dev/null && echo 'HTTPS API OK'
```

Caddy obtains and renews the certificate automatically when the hostname
resolves and ports 80/443 are reachable. The same reverse proxy forwards the
native WebSocket upgrade on `/chat`.
If HTTPS fails, inspect `sudo journalctl -u caddy -n 80 --no-pager` before
retrying certificate issuance.

## 3. Deploy the frontend to Vercel

Import the GitHub repository into Vercel and set **Root Directory** to
`frontend`. In Project Settings > Environments > Production > Branch Tracking,
select `dev-4`; otherwise Vercel may deploy the repo's default branch instead.
Set these Production environment variables before deploying:

```text
API_UPSTREAM_ORIGIN=https://api.167-172-73-163.sslip.io
NEXT_PUBLIC_CHAT_API_BASE_URL=https://api.167-172-73-163.sslip.io
```

Leave `NEXT_PUBLIC_API_BASE_URL` unset on Vercel. Browser Axios calls `/api` on
the Vercel site, and the Next.js rewrite forwards those requests to the VPS.
Server-rendered product pages call `API_UPSTREAM_ORIGIN` directly.
Use the exact URL Vercel assigns to the deployed frontend in the next step.

## 4. Allow that frontend origin in the Gateway

On the VPS, edit only the `FRONTEND_ORIGIN` line in
`/opt/gearvn/secrets/trial.env` to the exact Vercel origin, for example
`FRONTEND_ORIGIN=https://your-project.vercel.app` (no trailing slash). Do not
print or copy the other values from this secret file.

```bash
sudo nano /opt/gearvn/secrets/trial.env
cd /opt/gearvn/backend
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml config --quiet
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml up -d --no-deps --force-recreate api-gateway
```

Then open the Vercel URL in a browser and check product listing, login,
refresh after reload, cart, order and chat. In browser Network, REST calls
should go to the Vercel `/api/*` URLs and chat should use the VPS `wss://.../chat`.
If anything fails, record the HTTP status or WebSocket close code without
copying tokens or cookies. Local `http://localhost:3000` stops being an allowed
origin after changing `FRONTEND_ORIGIN`; set it back only for local trials.
