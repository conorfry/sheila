# Database Schema

Platform: **Supabase** (PostgreSQL)

## Tables

### cases

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `user_id` | uuid | — | no | Supabase auth user |
| `visa_type` | text | null | yes | `Subclass189`, `Subclass190`, `Subclass482`, `Subclass491` |
| `status` | text | `'Draft'` | no | See case lifecycle below |
| `progress_percent` | int | `0` | no | 0-100 |
| `created_at` | timestamptz | `now()` | no | |
| `updated_at` | timestamptz | `now()` | no | |

Case statuses: `Draft` > `InProgress` > `ActionRequired` > `ReadyForReview` > `ReadyForExport` > `Exported`

### quiz_responses

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `case_id` | uuid | — | no | FK > `cases.id` |
| `question_id` | text | — | no | e.g. `age`, `english_level` |
| `answer_json` | jsonb | — | yes | Raw answer value |
| `created_at` | timestamptz | `now()` | no | |

Unique constraint: `(case_id, question_id)`

### documents

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `case_id` | uuid | — | no | FK > `cases.id` |
| `storage_path` | text | — | no | Path in `sheila-docs` bucket |
| `file_name` | text | — | no | Original filename (sanitized) |
| `mime_type` | text | — | no | `application/pdf`, `image/jpeg`, `image/png` |
| `size_bytes` | bigint | — | no | |
| `category` | text | — | no | e.g. `Identity`, `Employment` |
| `slot_key` | text | — | no | e.g. `passport`, `payslips` |
| `status` | text | `'Uploaded'` | no | See document statuses below |
| `created_at` | timestamptz | `now()` | no | |

Document statuses: `Uploaded` > `Processing` > `Reviewed` | `Flagged` | `Failed`

### extractions

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `document_id` | uuid | — | no | FK > `documents.id` |
| `case_id` | uuid | — | no | FK > `cases.id` |
| `slot_key` | text | — | yes | Classified slot |
| `classification` | text | — | yes | Detected document type |
| `classification_confidence` | float | — | yes | 0.0-1.0 |
| `classification_reasons` | text[] | — | yes | Array of reason strings |
| `fields` | jsonb | — | yes | Extracted field values |
| `field_confidence` | jsonb | — | yes | Per-field confidence scores |
| `errors` | text[] | — | yes | Extraction error messages |
| `created_at` | timestamptz | `now()` | no | |

TODO: Confirm whether this table exists in Supabase or needs to be created. The worker code writes to it in `apps/worker/src/jobs/processDocument.ts`.

### flags

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `case_id` | uuid | — | no | FK > `cases.id` |
| `document_id` | uuid | — | yes | FK > `documents.id` |
| `field` | text | — | no | Field name or validation code |
| `message` | text | — | no | Human-readable description |
| `severity` | text | — | no | `Verified`, `Review`, `PotentialBlocker` |
| `is_resolved` | boolean | `false` | no | |
| `created_at` | timestamptz | `now()` | no | |

### exports

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | no | PK |
| `case_id` | uuid | — | no | FK > `cases.id` |
| `storage_path` | text | — | yes | Path in `sheila-exports` bucket (null until complete) |
| `status` | text | `'Pending'` | no | `Pending`, `Processing`, `Complete`, `Failed` |
| `created_at` | timestamptz | `now()` | no | |

## Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `sheila-docs` | User-uploaded documents | Signed URLs (10 min expiry) |
| `sheila-exports` | Generated ZIP archives | Signed URLs (10 min expiry) |

TODO: Confirm bucket RLS policies in Supabase dashboard. The API uses `service_role` key which bypasses RLS, but direct client access would need policies.

## Indexes

TODO: Confirm which indexes exist beyond primary keys. Recommended:

- `cases(user_id)` - dashboard listing
- `documents(case_id)` - case detail queries
- `flags(case_id)` - flag listing
- `flags(document_id)` - flag cleanup on reprocessing
- `exports(case_id)` - latest export lookup
- `quiz_responses(case_id)` - quiz loading

## Missing SQL Migrations

There are no SQL migration files in the repo. The schema is managed directly in the Supabase dashboard.

TODO: Consider adding a `supabase/migrations/` directory with versioned SQL files for reproducibility.
