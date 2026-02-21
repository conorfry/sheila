# Build State

## Monorepo Layout

| Workspace | Path | Type | Build Output |
|---|---|---|---|
| `@sheila/shared` | `packages/shared` | Library | `dist/` (tsc) |
| `@sheila/doc-rules` | `packages/doc-rules` | Library | `dist/` (tsc) |
| `@sheila/visa-rules` | `packages/visa-rules` | Library | `dist/` (tsc) |
| `@sheila/api` | `apps/api` | Fastify server | `dist/index.js` (tsc) |
| `@sheila/worker` | `apps/worker` | BullMQ workers | `dist/index.js` (tsc) |
| `@sheila/web` | `apps/web` | Next.js app | `.next/standalone/server.js` |

## Build Order

`npm run build` at the root runs:

```
npm run build -w packages/shared && npm run build --workspaces --if-present
```

`@sheila/shared` must build first because `@sheila/doc-rules` imports `@sheila/shared/types`. The remaining workspaces build in parallel.

## TypeScript Configuration

All workspaces extend `tsconfig.base.json`:

- Target: ES2022
- Module: Node16 / NodeNext
- Strict mode enabled
- Declarations + source maps emitted

`apps/web` uses Next.js-managed tsconfig with `@/*` path alias pointing to `./src/*`.

## Dev Scripts

| Script | Command |
|---|---|
| `npm run dev:api` | `tsx watch --env-file=../../.env src/index.ts` |
| `npm run dev:worker` | `tsx watch --env-file=../../.env src/index.ts` |
| Web dev | `cd apps/web && npm run dev` (Next.js on port 3000) |

## Node Version

`engines.node` in root `package.json`: `>=20`

## Key Dependencies

| Dependency | Version | Used By |
|---|---|---|
| `fastify` | ^5.1.0 | api |
| `bullmq` | ^5.12.0 | api, worker |
| `@supabase/supabase-js` | ^2.45.0 | api, worker, web |
| `@anthropic-ai/sdk` | ^0.74.0 | worker |
| `next` | ^15.1.0 | web |
| `react` | ^19.0.0 | web |
| `zod` | ^3.23.0 | api, doc-rules |
| `vitest` | ^3.0.0 | root (test runner) |
| `pdf-parse` | ^2.4.5 | worker |
| `tesseract.js` | ^5.1.1 | worker |
| `archiver` | ^7.0.1 | worker |
| `pino` | ^9.4.0 | api, worker |

## Deployment

Railway (Railpack builder). Each service is a separate Railway service sharing the same repo with root directory `/`.

| Service | Start Command |
|---|---|
| web | `node apps/web/.next/standalone/server.js` |
| api | `node apps/api/dist/index.js` |
| worker | `node apps/worker/dist/index.js` |

Build command for all: `npm run build`

## Known Issues

- `npm audit` reports 7 vulnerabilities (1 moderate, 6 high) in transitive deps. TODO: triage in `package-lock.json`.
- Linter is a no-op: `"lint": "echo 'no linter configured yet'"`.
