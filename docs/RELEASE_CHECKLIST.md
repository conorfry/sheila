# Release Checklist

## Pre-Release

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No new `npm audit` critical/high vulnerabilities (currently 7 known — TODO: triage)
- [ ] Environment variables are set for all services (see `docs/ENVIRONMENT_VARIABLES.md`)
- [ ] Supabase storage buckets exist: `sheila-docs`, `sheila-exports`
- [ ] Supabase tables match schema (see `docs/DB_SCHEMA.md`)

## Database Changes

- [ ] If schema changed: apply migrations in Supabase dashboard (no migration files yet)
- [ ] If RLS policies changed: update in Supabase dashboard
- [ ] If new storage bucket needed: create in Supabase dashboard
- [ ] Test rollback plan if migration is destructive

TODO: Add SQL migration files to repo (`supabase/migrations/`) for version-controlled schema changes.

## Deploy

- [ ] Commit and push to `main`
- [ ] Deploy all three services:
  ```bash
  ~/.local/bin/railway up -s web -d
  ~/.local/bin/railway up -s api -d
  ~/.local/bin/railway up -s worker -d
  ```
- [ ] Watch build logs in Railway dashboard

TODO: Confirm whether Railway auto-deploys on push to `main`. If so, manual `railway up` is only needed for out-of-band deploys.

## Post-Deploy Verification

- [ ] API health check returns 200:
  ```bash
  curl https://api-production-273d.up.railway.app/health
  ```
- [ ] Web app loads login page: https://web-production-57b7c.up.railway.app
- [ ] Check Railway logs for each service — no crash loops:
  ```bash
  ~/.local/bin/railway logs -s api
  ~/.local/bin/railway logs -s worker
  ~/.local/bin/railway logs -s web
  ```
- [ ] Sign in and create a test case
- [ ] Complete quiz and receive visa recommendation
- [ ] Upload a test document and verify processing completes
- [ ] Check flags appear for the document
- [ ] Export case and download ZIP

## Rollback

Railway keeps previous deployments. To rollback:

1. Open the service in Railway dashboard
2. Find the previous successful deployment
3. Click "Redeploy" on that deployment

Or via CLI:
```bash
# List recent deployments
~/.local/bin/railway deployment -s api

# Redeploy a specific deployment
~/.local/bin/railway redeploy -s api
```

TODO: Confirm exact CLI syntax for rolling back to a specific deployment.

## Hotfix Process

1. Branch from `main`: `git checkout -b hotfix/<description>`
2. Fix the issue
3. Run tests: `npm test`
4. Build: `npm run build`
5. Push and deploy affected service(s)
6. Merge back to `main`

## Version Tagging

TODO: No versioning strategy exists. Consider:
- Semantic versioning for packages
- Git tags for releases (`v0.1.0`, `v0.2.0`, etc.)
- Changelog generation
