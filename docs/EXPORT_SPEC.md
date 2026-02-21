# Export Specification

## Overview

The export system generates a ZIP archive containing all documents for a case, organized by category with a summary report.

**File:** `apps/worker/src/jobs/exportZip.ts`

## Trigger

1. User clicks "Export" in the web UI
2. API inserts an `exports` row (status: `Pending`)
3. API enqueues an `exportZip` job in the `exports` BullMQ queue
4. API updates case status

Validation before enqueue:
- Case must have a `visa_type` set
- No existing export with status `Pending` or `Processing` (returns 409)

## ZIP Structure

```
<case-id>.zip
├── 00_Sheila_Summary/
│   └── summary.txt
├── 01_Identity/
│   ├── passport.pdf
│   └── birth_certificate.pdf
├── 02_Employment/
│   ├── reference_letter.pdf
│   ├── payslips.pdf
│   └── employment_contract.pdf
├── 03_Education/
│   ├── degree_certificate.pdf
│   └── transcripts.pdf
└── 04_Sponsorship/        (Subclass482 only)
    └── sponsor_approval_letter.pdf
```

## Category Numbering

| Prefix | Category |
|---|---|
| `00` | Sheila_Summary |
| `01` | Identity |
| `02` | Employment |
| `03` | Education |
| `04` | Sponsorship |

TODO: Confirm exact folder naming logic in `apps/worker/src/jobs/exportZip.ts`. The category-to-number mapping may be index-based rather than hardcoded.

## Summary Report

`00_Sheila_Summary/summary.txt` contains:

- Case ID
- Visa type
- Case status
- Export timestamp
- Document listing per category:
  - File name
  - Slot key
  - Document status
  - Upload date
- Flag listing:
  - Field
  - Message
  - Severity
  - Resolved status

TODO: Confirm exact summary format in `apps/worker/src/jobs/exportZip.ts`.

## Storage

- ZIP is uploaded to the `sheila-exports` Supabase storage bucket
- Path: `exports/<caseId>/<exportId>.zip`
- Download URL is a signed URL with expiry (generated on `GET /cases/:caseId/export`)

## Status Lifecycle

| Status | Meaning |
|---|---|
| `Pending` | Job enqueued, not yet started |
| `Processing` | Worker is building the ZIP |
| `Complete` | ZIP uploaded, download URL available |
| `Failed` | Error during export |

## Frontend Polling

The web UI polls `GET /cases/:caseId/export` every 3 seconds until the export status is `Complete` or `Failed`. A download button appears on completion.

**File:** `apps/web/src/app/(dashboard)/case/[caseId]/export-section.tsx`

## Error Handling

- If any document fails to download from storage, the export continues without it (TODO: confirm this behavior in `apps/worker/src/jobs/exportZip.ts`)
- On unhandled error: export status set to `Failed`
- Case status is updated to `Exported` only on success
