# Environment Variables

## Variable Reference

### API (`apps/api`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Bypasses RLS, server-side only |
| `REDIS_URL` | No | `redis://localhost:6379` | BullMQ connection |
| `PORT` | No | `8080` | HTTP listen port. Railway sets this automatically |

### Worker (`apps/worker`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Bypasses RLS, server-side only |
| `REDIS_URL` | No | `redis://localhost:6379` | BullMQ connection |
| `CLAUDE_API_KEY` | No | — | Anthropic API key. Without it, classification falls back to filename heuristics and field extraction is skipped |
| `NODE_ENV` | No | — | Set to `production` for JSON logging (pino) |

### Web (`apps/web`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Public Supabase URL (embedded in client bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Public anon key (embedded in client bundle) |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8080` | API base URL |

## Local Development

Copy `.env.example` to `.env` at the repo root:

```bash
cp .env.example .env
```

The API and worker dev scripts load from `../../.env` via `tsx watch --env-file=../../.env`.

The web app reads from `apps/web/.env.local` (Next.js convention).

## Railway Deployment

Environment variables are set per-service in Railway. Current configuration:

| Variable | web | api | worker |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | x | | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | x | | |
| `NEXT_PUBLIC_API_URL` | x | | |
| `SUPABASE_URL` | | x | x |
| `SUPABASE_SERVICE_ROLE_KEY` | | x | x |
| `REDIS_URL` | | x | x |
| `CLAUDE_API_KEY` | | | x |
| `PORT` | auto | auto | — |

`REDIS_URL` on Railway uses a service reference: `${{Redis.REDIS_URL}}`

## Secrets

The following are sensitive and must never be committed or exposed client-side:

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access, bypasses RLS
- `CLAUDE_API_KEY` - Billed Anthropic API access

The following are public by design:

- `NEXT_PUBLIC_SUPABASE_URL` - Project URL, no secret
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Scoped to RLS-permitted operations only
