# Document Processing Pipeline

## Overview

```
User uploads file
  -> API records document, enqueues job
    -> Worker extracts text (PDF / OCR)
      -> Worker classifies document type (Claude)
        -> Worker extracts structured fields (Claude + Zod)
          -> Worker validates fields (doc-rules)
            -> Worker creates/updates flags
              -> Worker recomputes case status
```

## Step-by-Step

### 1. Upload (API)

**Files:** `apps/api/src/routes/documents.ts`

1. Client calls `POST /cases/:caseId/documents/presign` with `fileName`, `mimeType`, `slotKey`, `category`
2. API generates a Supabase signed upload URL (bucket: `sheila-docs`, path: `cases/<caseId>/<slotKey>/<sanitizedFileName>`)
3. Client uploads the file directly to the signed URL via PUT
4. Client calls `POST /cases/:caseId/documents/complete` with upload metadata
5. API inserts a `documents` row (status: `Uploaded`)
6. API enqueues a `processDocument` job in the `documents` BullMQ queue

### 2. Text Extraction (Worker)

**File:** `apps/worker/src/lib/extractText.ts`

| MIME Type | Method | Library |
|---|---|---|
| `application/pdf` | Structured text extraction | `pdf-parse` |
| `image/jpeg`, `image/png` | OCR | `tesseract.js` (English) |

- Downloads file from Supabase storage
- Extracts up to 20,000 characters
- Returns empty string on failure (processing continues with degraded results)

### 3. Classification (Worker)

**File:** `apps/worker/src/lib/llm.ts` - `classifyDocument()`

- Model: `claude-sonnet-4-5-20250929`
- Input: extracted text + original filename
- Output: `{ document_type, confidence, reasons[] }`

Possible types:
`passport`, `birth_certificate`, `employment_contract`, `payslips`, `english_test_result`, `reference_letter`, `degree_certificate`, `transcripts`, `sponsor_approval_letter`, `other`

**Fallback (no API key):** filename-based heuristic matching.

### 4. Field Extraction (Worker)

**File:** `apps/worker/src/lib/llm.ts` - `extractFields()`

- Model: `claude-sonnet-4-5-20250929`
- Input: extracted text + slot key + Zod schema (from `@sheila/doc-rules`)
- Output: `{ fields, fieldConfidence, raw, errors[] }`
- Schema lookup: `EXTRACTION_SCHEMAS[slotKey]` in `packages/doc-rules/src/schemas.ts`

If no schema exists for the slot key, extraction is skipped.

### 5. Persistence (Worker)

**File:** `apps/worker/src/jobs/processDocument.ts`

Inserts into `extractions` table:
- `document_id`, `case_id`, `slot_key`
- `classification`, `classification_confidence`, `classification_reasons`
- `fields` (jsonb), `field_confidence` (jsonb), `errors`

### 6. Validation (Worker)

**File:** `packages/doc-rules/src/validators/common.ts` - `validateDocument()`

Dispatches to type-specific validators. Each returns an array of `ValidationFlag`:

```typescript
{ code: string, field: string, message: string, severity: "Verified" | "Review" | "PotentialBlocker" }
```

See individual validators in `packages/doc-rules/src/validators/` for rules per document type.

### 7. Flag Management (Worker)

1. Deletes existing flags for the document (`document_id`)
2. Inserts new flags from validation results
3. Sets document status to `Reviewed` (no blockers) or `Flagged` (has blockers)

### 8. Case Status Recomputation (Worker)

**File:** `apps/worker/src/lib/status.ts` - `recomputeCaseStatus()`

Logic:
- Any document `Processing` -> case `InProgress`
- Any unresolved `PotentialBlocker` flag -> case `ActionRequired`
- All documents `Reviewed` or `Flagged` (none processing) -> case `ReadyForExport`
- Otherwise -> case `InProgress`

## Supported Document Types

| Slot Key | Category | Schema | Validator |
|---|---|---|---|
| `passport` | Identity | Yes | Yes |
| `birth_certificate` | Identity | Yes | Yes |
| `english_test_result` | English | Yes | Yes |
| `payslips` | Employment | Yes | Yes |
| `employment_contract` | Employment | Yes | Yes |
| `reference_letter` | Employment | Yes | Yes |
| `degree_certificate` | Education | Yes | Yes |
| `transcripts` | Education | Yes | Yes |
| `sponsor_approval_letter` | Sponsorship | Yes | Yes |

## Worker Concurrency

- Document processing: 5 concurrent jobs
- Export processing: 2 concurrent jobs

Configured in `apps/worker/src/index.ts`.

## Error Handling

- Text extraction failure: continues with empty text
- Classification failure: document marked as `other`
- Field extraction failure: logged, no fields saved
- Validation failure: logged, no flags created
- Any unhandled error: document status set to `Failed`, case status recomputed
