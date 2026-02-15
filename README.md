# Sheila

Visa application case management system. Node.js + TypeScript monorepo with Fastify API, BullMQ workers, Supabase (Postgres + Storage), and Redis.

## Prerequisites

- Node.js >= 20
- Docker (for Redis)
- A Supabase project (hosted or local)

## Project structure

```
sheila/
  apps/
    api/          Fastify REST API
    worker/       BullMQ background job workers
  packages/
    shared/       Types and constants
    visa-rules/   Visa definitions, scoring, checklists
    doc-rules/    Document extraction schemas and validators
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values in `.env`:

- `SUPABASE_URL` -- your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` -- service role key (server-side only, not the anon key)
- `SUPABASE_ANON_KEY` -- anon/public key (used by client-side auth)
- `REDIS_URL` -- defaults to `redis://localhost:6379`
- `PORT` -- API port, defaults to `8080`

### 3. Start Redis

```bash
docker compose up -d
```

Verify Redis is running:

```bash
docker compose ps
```

### 4. Set up Supabase tables

Create the following tables in your Supabase project (via the dashboard SQL editor or migrations):

```sql
create table cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  visa_type text,
  status text not null default 'Draft',
  progress_percent int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  question_id text not null,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  unique(case_id, question_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  category text not null,
  slot_key text not null,
  status text not null default 'Uploaded',
  created_at timestamptz not null default now()
);

create table flags (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  document_id uuid references documents(id),
  field text not null,
  message text not null,
  severity text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table exports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  storage_path text,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);
```

Also create a storage bucket named `sheila-docs` in the Supabase dashboard under Storage.

### 5. Run the API

```bash
npm run dev:api
```

The API starts on `http://localhost:8080` (or your configured PORT).

### 6. Run the worker

In a separate terminal:

```bash
npm run dev:worker
```

## API endpoints

All endpoints except `/health` require an `Authorization: Bearer <supabase_jwt>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/cases` | Create a new case |
| GET | `/cases/:caseId` | Get case with doc/flag counts |
| POST | `/cases/:caseId/quiz` | Upsert quiz responses |
| POST | `/cases/:caseId/recommendation` | Compute visa recommendation |
| GET | `/cases/:caseId/checklist` | Get document checklist |
| POST | `/cases/:caseId/documents/presign` | Get presigned upload URL |
| POST | `/cases/:caseId/documents/upload` | Server-side file upload |
| POST | `/cases/:caseId/documents/complete` | Record upload and enqueue processing |
| GET | `/cases/:caseId/documents` | List documents |
| GET | `/cases/:caseId/flags` | List flags |
| POST | `/flags/:flagId/resolve` | Resolve/unresolve a flag |
| POST | `/cases/:caseId/export` | Start an export job |
| GET | `/cases/:caseId/export` | Get latest export record |

## Building for production

```bash
npm run build
```

Then run each app:

```bash
node apps/api/dist/index.js
node apps/worker/dist/index.js
```
