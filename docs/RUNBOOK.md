# Runbook

## Local Development Setup

### Prerequisites

- Node.js >= 20
- Docker (for Redis)
- Supabase project with tables created (see `docs/DB_SCHEMA.md`)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase and (optionally) Claude API keys

# Set up web env
# Edit apps/web/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   NEXT_PUBLIC_API_URL=http://localhost:8080

# 3. Start Redis
docker compose up -d

# 4. Build all packages
npm run build

# 5. Start API (terminal 1)
npm run dev:api
# Listening on http://localhost:8080

# 6. Start Worker (terminal 2)
npm run dev:worker

# 7. Start Web (terminal 3)
cd apps/web && npm run dev
# Listening on http://localhost:3000
```

### Verify

- `curl http://localhost:8080/health` should return `{"success":true,"data":{"ok":true}}`
- Open `http://localhost:3000` - login page should load
- Sign up, create a case, upload a document, check worker logs for processing

## Railway Deployment

### Project

- Dashboard: https://railway.com/project/dd671678-8214-4c3c-aa2b-9ddd2058e490
- Services: web, api, worker, Redis

### Deploying

Deployments are triggered by:
- `railway up -s <service>` from the CLI
- TODO: Confirm if GitHub auto-deploy is enabled. Check Railway dashboard > service settings > source.

### Checking Logs

```bash
# Tail logs for a service
~/.local/bin/railway logs -s api
~/.local/bin/railway logs -s worker
~/.local/bin/railway logs -s web
```

Or view in the Railway dashboard.

### Service URLs

| Service | URL |
|---|---|
| Web | https://web-production-57b7c.up.railway.app |
| API | https://api-production-273d.up.railway.app |
| API Health | https://api-production-273d.up.railway.app/health |

### Environment Variables

```bash
# List vars for a service
~/.local/bin/railway variable list -s api

# Set a variable
~/.local/bin/railway variable set -s worker 'CLAUDE_API_KEY=sk-ant-...'
```

See `docs/ENVIRONMENT_VARIABLES.md` for the full reference.

## Common Issues

### Build fails with "Cannot find module '@sheila/shared/types'"

The build script must compile `packages/shared` first. The root `package.json` build script handles this:

```
npm run build -w packages/shared && npm run build --workspaces --if-present
```

If you see this error on Railway, check that the build command is `npm run build`.

### Worker not processing documents

1. Check Redis is running: `redis-cli ping` (local) or check Railway Redis service
2. Check worker logs for connection errors
3. Verify `REDIS_URL` is set correctly
4. Check BullMQ queue: the API must be enqueuing jobs to the `documents` queue

### Document extraction returns empty text

- PDF: `pdf-parse` may fail on scanned/image-only PDFs. These fall through to empty text.
- Images: Tesseract.js OCR requires clear text. Low-quality images may produce empty results.
- Check worker logs for extraction errors.

### Export fails

1. Check worker logs for the `exportZip` job
2. Verify `sheila-exports` bucket exists in Supabase Storage
3. Verify all documents referenced by the case exist in `sheila-docs` bucket
4. Check for storage permission errors

### "No start command was found" on Railway

The build and start commands must be set in Railway service settings (not just in `railway.json`). They were configured via the Railway GraphQL API. If reset, re-apply:

- Build: `npm run build`
- Start: `node apps/<service>/dist/index.js` (or `node apps/web/.next/standalone/server.js` for web)

### Auth redirect loop

- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set on the web service
- Check the Supabase project's Site URL is set to the web service URL in Supabase Auth settings
- Check the Redirect URLs list includes the web service URL

## Monitoring

### Health Check

```bash
curl https://api-production-273d.up.railway.app/health
```

Expected: `{"success":true,"data":{"ok":true}}`

### Logging

- API and worker use Pino logger
- Development: pretty-printed to stdout
- Production (`NODE_ENV=production`): JSON to stdout (Railway captures this)
- Child loggers include context: job ID, case ID, document ID

### Redis

TODO: Add Redis monitoring. Consider Railway's built-in Redis metrics or `redis-cli info` for queue depth.

## Scaling

- Worker concurrency: 5 document jobs, 2 export jobs (configured in `apps/worker/src/index.ts`)
- To increase: update concurrency values and redeploy worker
- API and worker scale independently on Railway
- TODO: Consider horizontal scaling with multiple worker replicas (BullMQ supports this natively)
