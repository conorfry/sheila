# API Contract

Base URL: `http://localhost:8080` (dev) or `$NEXT_PUBLIC_API_URL` (prod)

## Authentication

All endpoints except `/health` require a Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase-jwt>
```

The API validates the token via `apps/api/src/lib/auth.ts` and attaches `userId` to the request. Every case-scoped endpoint also verifies the authenticated user owns the case.

## Response Envelope

All responses follow:

```json
{
  "success": true | false,
  "data": <T> | null,
  "error": "<message>" | null
}
```

## Endpoints

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Returns `{ ok: true }` |

---

### Cases

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/cases` | Yes | Create a new case |
| GET | `/cases/:caseId` | Yes | Get case with `document_count` and `unresolved_flag_count` |

**POST /cases** - 201 Created

Request: empty body

Response `data`:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "visa_type": null,
  "status": "Draft",
  "progress_percent": 0,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

**GET /cases/:caseId** - 200

Response `data`: case row plus `document_count` (int) and `unresolved_flag_count` (int).

---

### Quiz

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/cases/:caseId/quiz` | Yes | Upsert quiz responses |
| POST | `/cases/:caseId/recommendation` | Yes | Calculate visa score, update case |

**POST /cases/:caseId/quiz**

Request:
```json
{
  "responses": [
    { "question_id": "age", "answer": 30 },
    { "question_id": "experience_years", "answer": 5 },
    { "question_id": "english_level", "answer": "superior" },
    { "question_id": "qualification", "answer": "masters" },
    { "question_id": "partner_skills", "answer": false },
    { "question_id": "employer_sponsor", "answer": false }
  ]
}
```

**POST /cases/:caseId/recommendation** - 200

Response `data`:
```json
{
  "primaryVisa": "Subclass189",
  "fallbackVisa": "Subclass190",
  "rationale": ["Age 30: 30 points.", "..."],
  "pointsTotal": 75
}
```

Side effect: updates `cases.visa_type` to `primaryVisa` and `cases.status` to `InProgress`.

---

### Checklist

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cases/:caseId/checklist` | Yes | Required documents for the case's visa type |

Response `data`:
```json
{
  "visa_type": "Subclass189",
  "slots": [
    {
      "category": "Identity",
      "slot_key": "passport",
      "required": true,
      "description": "Certified copy of passport bio page.",
      "accepted_mime": ["application/pdf", "image/jpeg", "image/png"],
      "upload_status": "Missing"
    }
  ]
}
```

`upload_status` values: `Missing`, `Uploaded`, `Flagged`, `Verified`.

---

### Documents

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/cases/:caseId/documents/presign` | Yes | Get signed upload URL |
| POST | `/cases/:caseId/documents/upload` | Yes | Server-side file upload (fallback) |
| POST | `/cases/:caseId/documents/complete` | Yes | Record upload, enqueue processing |
| GET | `/cases/:caseId/documents` | Yes | List all documents for case |

**POST /cases/:caseId/documents/presign**

Request:
```json
{
  "fileName": "passport.pdf",
  "mimeType": "application/pdf",
  "slotKey": "passport",
  "category": "Identity"
}
```

Response `data`:
```json
{
  "uploadUrl": "https://...supabase.co/storage/...",
  "storagePath": "cases/<caseId>/passport/passport.pdf"
}
```

**POST /cases/:caseId/documents/complete**

Request:
```json
{
  "storagePath": "cases/<caseId>/passport/passport.pdf",
  "fileName": "passport.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 102400,
  "category": "Identity",
  "slotKey": "passport"
}
```

Side effect: inserts document row, enqueues `processDocument` job in BullMQ.

---

### Flags

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cases/:caseId/flags` | Yes | List all flags for case |
| POST | `/flags/:flagId/resolve` | Yes | Toggle `is_resolved` |

**POST /flags/:flagId/resolve**

Request:
```json
{ "resolved": true }
```

---

### Exports

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/cases/:caseId/export` | Yes | Start export job |
| GET | `/cases/:caseId/export` | Yes | Get latest export + download URL |

**POST /cases/:caseId/export** - 201

Side effects: inserts export row (status `Pending`), enqueues `exportZip` job, updates case status.

**GET /cases/:caseId/export** - 200

Response `data`:
```json
{
  "latestExport": {
    "id": "uuid",
    "case_id": "uuid",
    "storage_path": "exports/.../file.zip",
    "status": "Complete",
    "created_at": "ISO8601"
  },
  "downloadUrl": "https://...signed-url..."
}
```

Export `status` values: `Pending`, `Processing`, `Complete`, `Failed`.

---

## Error Codes

| HTTP | Meaning | When |
|---|---|---|
| 400 | Bad Request | Zod validation failure, missing fields |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | User does not own the case |
| 404 | Not Found | Case or resource not found |
| 409 | Conflict | Export already pending/processing |
| 500 | Internal Server Error | Unhandled exception |
