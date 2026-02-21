# Test Plan

## Current Test Coverage

### Framework

- **Runner:** Vitest 3.0.0
- **Command:** `npm test` (runs `vitest run` at root)

### Existing Tests

| File | Package | What It Tests |
|---|---|---|
| `packages/doc-rules/src/__tests__/schemas.test.ts` | doc-rules | Zod schema validation for all 9 document types |
| `packages/doc-rules/src/__tests__/validators.test.ts` | doc-rules | Validator logic for all 9 document types |
| `packages/visa-rules/src/__tests__/scoring.test.ts` | visa-rules | Points calculation and visa recommendation |
| `packages/visa-rules/src/__tests__/checklist.test.ts` | visa-rules | Checklist generation per visa type |
| `apps/worker/src/__tests__/extractText.test.ts` | worker | Text extraction with mocked storage |
| `apps/worker/src/__tests__/llm.test.ts` | worker | LLM classification and field extraction |

### What's Tested

- Schema validation: valid inputs pass, invalid inputs fail with correct errors
- Validator rules: expiry checks, range checks, required field checks
- Scoring: points calculation for age, experience, english, qualifications
- Recommendation: correct visa selection based on total points
- Checklist: correct slots returned per visa type, sponsor slots only for 482
- Text extraction: PDF and image paths, error handling
- LLM: classification output shape, field extraction with schema

### What's Not Tested

- **API routes** - No integration tests for Fastify endpoints
- **Authentication** - No tests for JWT validation or case ownership
- **Worker jobs** - No end-to-end tests for `processDocument` or `exportZip`
- **Frontend** - No component tests or E2E tests
- **Database** - No tests against real or mocked Supabase

## Recommended Test Additions

### Priority 1: API Route Tests

```
apps/api/src/__tests__/
  cases.test.ts        - CRUD operations, auth enforcement
  documents.test.ts    - Upload flow, presign, complete
  quiz.test.ts         - Quiz upsert, recommendation
  flags.test.ts        - Flag listing, resolution
  exports.test.ts      - Export creation, status retrieval
```

Approach: Use `fastify.inject()` for in-process HTTP testing. Mock Supabase client and BullMQ queue.

### Priority 2: Worker Job Tests

```
apps/worker/src/__tests__/
  processDocument.test.ts  - Full pipeline: extract > classify > extract fields > validate > flags
  exportZip.test.ts        - ZIP generation with mocked storage
```

Approach: Mock Supabase client, storage, and Claude API. Verify database writes and status transitions.

### Priority 3: Frontend E2E

TODO: Choose E2E framework (Playwright or Cypress).

Key flows:
- Sign up > confirm email > log in
- Create case > complete quiz > get recommendation
- Upload document > wait for processing > check flags
- Resolve flags > export > download ZIP

### Priority 4: Integration Tests

- API + Worker integration: enqueue job, verify processing
- Full upload-to-flags pipeline with mocked external services

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run specific workspace tests
npx vitest --project doc-rules
npx vitest --project visa-rules

# Run with coverage
npx vitest --coverage
```

TODO: Configure coverage thresholds in `vitest.config.ts` (does not exist yet — vitest uses workspace detection).

## CI/CD

TODO: No CI pipeline exists. Recommended:
- GitHub Actions workflow on push/PR
- Steps: install > build > test > (deploy on main)
- Gate merges on test pass
