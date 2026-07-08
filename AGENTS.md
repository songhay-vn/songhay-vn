<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **songhay-vn** (2077 symbols, 6328 relationships, 159 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/songhay-vn/context` | Codebase overview, check index freshness |
| `gitnexus://repo/songhay-vn/clusters` | All functional areas |
| `gitnexus://repo/songhay-vn/processes` | All execution flows |
| `gitnexus://repo/songhay-vn/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# VPS Operations Runbook

This project runs in production on a full VPS. Keep this section practical and command-oriented so future agents can debug without rediscovering the server layout.

## Production Facts

- Primary domain: `https://songhay.vn`
- Canonical redirect: `https://www.songhay.vn` -> `https://songhay.vn`
- VPS host: `157.66.219.250`
- OS: Ubuntu VPS
- Normal deploy user: `deploy`
- Emergency/system user: `root`
- App base directory: `/opt/songhay`
- Source mirror on VPS: `/opt/songhay/source`
- Runtime releases: `/opt/songhay/runtime/releases`
- Current live release symlink: `/opt/songhay/runtime/current`
- Environment files: `/opt/songhay/env`
- Backups: `/opt/songhay/backups`
- Stack: Docker Compose with `postgres`, `app`, and `caddy`
- Database: PostgreSQL container, bound only to `127.0.0.1:5432` on the VPS
- App runtime: Next standalone running in `songhay-app`
- SSL/reverse proxy: Caddy in `songhay-caddy`

Do not print, commit, paste, or summarize secret values from `/opt/songhay/env/*`, GitHub Actions secrets, SSH private keys, or database URLs. It is OK to list secret names and file paths.

## SSH Access

From Windows PowerShell, connect as the normal deploy user:

```powershell
ssh -i "$env:USERPROFILE\.ssh\songhay_vps_deploy" deploy@157.66.219.250
```

Connect as root only for system administration:

```powershell
ssh root@157.66.219.250
```

Useful one-off remote command pattern:

```powershell
ssh -i "$env:USERPROFILE\.ssh\songhay_vps_deploy" deploy@157.66.219.250 "docker compose -f /opt/songhay/docker-compose.yml ps"
```

Once on the VPS, use this variable to reduce typing:

```bash
COMPOSE=/opt/songhay/docker-compose.yml
```

## Docker And Service Health

Show all services:

```bash
docker compose -f /opt/songhay/docker-compose.yml ps
```

Follow live logs:

```bash
docker compose -f /opt/songhay/docker-compose.yml logs -f app caddy postgres
```

Tail recent logs:

```bash
docker compose -f /opt/songhay/docker-compose.yml logs --tail=120 app caddy postgres
```

Restart only the app:

```bash
docker compose -f /opt/songhay/docker-compose.yml restart app
```

Restart Caddy, useful after DNS/SSL edits:

```bash
docker compose -f /opt/songhay/docker-compose.yml restart caddy
```

Restart the full stack without deleting volumes:

```bash
docker compose -f /opt/songhay/docker-compose.yml up -d --remove-orphans
```

Never run `docker compose down -v` on production unless the user explicitly asks to destroy the database volume.

## Deploy Flow

Normal deploy is automatic:

1. Push to `main`.
2. GitHub Actions workflow `.github/workflows/deploy-vps.yml` starts:
   - Configures the SSH key.
   - Fetches the current `/opt/songhay/env/build.env` from the VPS.
   - Installs Bun dependencies, generates the Prisma client, and builds the Next.js standalone app on the runner.
   - Builds the Docker image `songhay-app:latest` on the runner.
   - Rsyncs the updated source code (excluding `.next` and `node_modules`) to `/opt/songhay/source`.
   - Saves, compresses, and transfers the Docker image to the VPS (`docker save | gzip | ssh ... docker load`).
3. The workflow SSHes into the VPS and executes `/opt/songhay/source/deploy/vps/deploy.sh`.
4. The deploy script runs Prisma database migrations, restarts the containers, and cleans up old docker images.

GitHub repository secrets required by the workflow:

```txt
VPS_HOST=157.66.219.250
VPS_PORT=22
VPS_USER=deploy
VPS_SSH_KEY=<private key for deploy user>
```

Monitor a live deploy from SSH:

```bash
ps -ef | grep -E 'deploy.sh|rsync|docker load' | grep -v grep
```

The deploy script uses a lock at `/tmp/songhay-deploy.lock`. If deploy says another deploy is running, first check processes:

```bash
ps -ef | grep -E 'deploy.sh|docker load' | grep -v grep
```

Only remove the lock if no deploy process exists:

```bash
rm -f /tmp/songhay-deploy.lock
```

## Runtime Environment Files

Runtime env files live on the VPS only:

```bash
ls -l /opt/songhay/env
```

Expected files:

- `/opt/songhay/env/app.env`: runtime app env used by the `app` container
- `/opt/songhay/env/build.env`: build-time env used by `deploy.sh`
- `/opt/songhay/env/db.env`: PostgreSQL container env

Safe way to list variable names without values:

```bash
sed -n 's/^\([^=#][^=]*\)=.*/\1/p' /opt/songhay/env/app.env | sort
sed -n 's/^\([^=#][^=]*\)=.*/\1/p' /opt/songhay/env/build.env | sort
sed -n 's/^\([^=#][^=]*\)=.*/\1/p' /opt/songhay/env/db.env | sort
```

Do not `cat` these files into chat. If an env value must be changed, edit on the VPS and restart/redeploy:

```bash
nano /opt/songhay/env/app.env
docker compose -f /opt/songhay/docker-compose.yml restart app
```

If build-time env changes too:

```bash
nano /opt/songhay/env/build.env
bash /opt/songhay/source/deploy/vps/deploy.sh
```

## Database Commands

Open `psql` inside the PostgreSQL container:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec postgres psql -U songhay -d songhay
```

Run a one-off SQL query:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres \
  psql -U songhay -d songhay -c 'select count(*) from "Post";'
```

Useful quick counts:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres psql -U songhay -d songhay -At <<'SQL'
select 'posts=' || count(*) from "Post";
select 'media=' || count(*) from "MediaAsset";
select 'migrations=' || count(*) from "_prisma_migrations";
SQL
```

Check active DB connections:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres psql -U songhay -d songhay -c \
  "select pid, usename, state, wait_event_type, wait_event, left(query, 120) as query from pg_stat_activity order by pid;"
```

Check table sizes:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres psql -U songhay -d songhay -c \
  "select relname, pg_size_pretty(pg_total_relation_size(relid)) as size from pg_catalog.pg_statio_user_tables order by pg_total_relation_size(relid) desc limit 20;"
```

Run Prisma migration status from source:

```bash
cd /opt/songhay/source
cp /opt/songhay/env/build.env .env
bunx --bun prisma migrate status
rm -f .env
```

Apply pending Prisma migrations:

```bash
cd /opt/songhay/source
cp /opt/songhay/env/build.env .env
bunx --bun prisma migrate deploy
rm -f .env
```

## Backups And Restore

Create a compressed PostgreSQL backup:

```bash
STAMP="$(date -u +%Y%m%d%H%M%S)"
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres \
  pg_dump -U songhay -d songhay -Fc \
  > "/opt/songhay/backups/songhay-$STAMP.dump"
chmod 600 "/opt/songhay/backups/songhay-$STAMP.dump"
ls -lh "/opt/songhay/backups/songhay-$STAMP.dump"
```

List backups:

```bash
ls -lh /opt/songhay/backups | sort
```

Restore is destructive. Confirm with the user before running it. Pattern:

```bash
BACKUP=/opt/songhay/backups/songhay-YYYYMMDDHHMMSS.dump
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres dropdb -U songhay --if-exists songhay
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres createdb -U songhay songhay
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres \
  pg_restore -U songhay -d songhay --no-owner --clean --if-exists "$BACKUP"
docker compose -f /opt/songhay/docker-compose.yml restart app
```

## App And HTTP Checks

From any machine:

```bash
curl -I https://songhay.vn
curl -I https://www.songhay.vn
curl -sS https://songhay.vn/api/posts/most-read | head
curl -I https://songhay.vn/login
curl -I https://songhay.vn/admin
curl -I https://songhay.vn/sitemap.xml
```

Expected:

- `https://songhay.vn` returns `200`
- `https://www.songhay.vn` returns `301` to `https://songhay.vn/`
- `/api/posts/most-read` returns JSON
- `/login`, `/admin`, and `/sitemap.xml` return `200`

From inside the app container:

```bash
docker compose -f /opt/songhay/docker-compose.yml exec -T app node --input-type=module <<'JS'
const paths = ['/', '/api/posts/most-read', '/login', '/admin', '/sitemap.xml'];
for (const path of paths) {
  const res = await fetch(`http://127.0.0.1:3000${path}`, { redirect: 'manual' });
  const text = await res.text();
  console.log(`${path} ${res.status} ${res.headers.get('location') ?? ''} ${text.slice(0, 120).replace(/\s+/g, ' ')}`);
}
JS
```

## DNS And SSL

DNS should be:

```txt
A      @     157.66.219.250
CNAME  www   songhay.vn
TTL    300 during cutover, higher after stable
```

Caddy automatically obtains and renews SSL certificates. Check Caddy logs:

```bash
docker compose -f /opt/songhay/docker-compose.yml logs --tail=200 caddy
```

Look for:

```txt
certificate obtained successfully
```

If certificates fail, verify DNS first:

```bash
dig +short songhay.vn A
dig +short www.songhay.vn CNAME
dig +short www.songhay.vn A
```

Then restart Caddy:

```bash
docker compose -f /opt/songhay/docker-compose.yml restart caddy
```

## Disk, Memory, And Cleanup

Check disk and memory:

```bash
df -h /
free -h
docker system df
```

The VPS is small, so builds can use swap. This is normal if temporary during `next build`.

Safe Docker cleanup:

```bash
docker image prune -f --filter "until=24h"
docker builder prune -f --filter "until=24h"
```

Keep at least the current and previous release. To inspect release sizes:

```bash
du -sh /opt/songhay/runtime/releases/* | sort -h
readlink /opt/songhay/runtime/current
```

Do not delete the directory returned by `readlink /opt/songhay/runtime/current`.

## Common Debug Playbooks

Deploy did not start after pushing to `main`:

```bash
stat -c '%y %n' /opt/songhay/source/deploy/vps/deploy.sh
ps -ef | grep -E 'deploy.sh|next build|docker build|rsync' | grep -v grep
```

If source mtime did not update, check GitHub Actions and repository secrets.

Deploy is slow:

```bash
ps -o pid,ppid,stat,etime,pcpu,pmem,cmd -p "$(pgrep -f 'next build' | head -1)"
free -h
df -h /
```

App returns 502/504:

```bash
docker compose -f /opt/songhay/docker-compose.yml ps
docker compose -f /opt/songhay/docker-compose.yml logs --tail=150 app caddy
docker compose -f /opt/songhay/docker-compose.yml restart app
```

Database errors:

```bash
docker compose -f /opt/songhay/docker-compose.yml ps postgres
docker compose -f /opt/songhay/docker-compose.yml logs --tail=150 postgres
docker compose -f /opt/songhay/docker-compose.yml exec -T postgres pg_isready -U songhay -d songhay
```

Admin page loads but writes fail:

1. Check app logs while reproducing the action.
2. Check DB connectivity with `pg_isready`.
3. Check Cloudinary/external API env variable names exist without printing values.
4. Run Prisma migration status from `/opt/songhay/source`.

Static assets or image optimizer failing:

```bash
docker compose -f /opt/songhay/docker-compose.yml logs --tail=150 app
curl -I 'https://songhay.vn/_next/static/'
```

Caddy logs like `client disconnected`, `stream closed`, or scanner requests for `.env` are usually internet noise unless they correlate with user-visible failures.

## Development & Testing Guidelines

- **Write Real Unit Tests**: For every new feature or bug fix, write a corresponding unit/integration test, or update existing tests to ensure compatibility.
- **NO "Cheat" Tests**: Tests must execute the actual implementation code (libraries, components, hooks, functions). Never write mock/cheat assertions that bypass the actual logic or assert hardcoded values (e.g., asserting `console.log(2+2)` instead of calling the target function/component to verify `2+2`).

## Safety Rules For Agents

- Keep all responses short, concise, and straight to the point.
- Prefer `deploy` for application operations; use `root` only for OS, firewall, package, or Docker daemon issues.
- Never expose `/opt/songhay/env/*` values.
- Never expose SSH private key contents.
- Never run destructive database restore/drop commands without explicit user confirmation.
- Never run `docker compose down -v` on production without explicit user confirmation.
- Before editing app symbols, follow the GitNexus instructions at the top of this file.
- Before committing, run `npx gitnexus detect-changes --repo songhay-vn`.
