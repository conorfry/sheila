# Security & Privacy

## Authentication

- **Method:** Supabase Auth (email + password)
- **Token:** JWT issued by Supabase, validated on every API request
- **Session:** Cookie-based in Next.js (via `@supabase/ssr`), refreshed by middleware

Signup requires email confirmation before activation.

**Files:**
- `apps/api/src/lib/auth.ts` - JWT validation + case ownership check
- `apps/web/src/lib/supabase/middleware.ts` - Session refresh + redirect logic
- `apps/web/src/middleware.ts` - Route protection

## Authorization

- Every case-scoped API endpoint verifies `cases.user_id = authenticated userId`
- Service-role key (used by API and worker) bypasses RLS — authorization is application-enforced
- No admin role or multi-user case sharing exists

## Secrets Management

| Secret | Where Used | Exposure Risk |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | API, Worker | Full DB access. Never in client bundle. |
| `CLAUDE_API_KEY` | Worker only | Billed API. Never in client bundle. |
| `SUPABASE_ANON_KEY` | Web client | Public by design, scoped to auth + RLS |

Secrets are stored in:
- `.env` locally (gitignored)
- Railway service variables in production

## Data at Rest

- Documents stored in Supabase Storage (`sheila-docs` bucket)
- Extracted text and fields stored in `extractions` table as JSONB
- User passwords managed by Supabase Auth (bcrypt hashed)

TODO: Confirm Supabase storage encryption settings in the Supabase dashboard.

## Data in Transit

- All Supabase connections use HTTPS/TLS
- Railway services communicate over internal network (Redis on `railway.internal`)
- API served over HTTPS in production (Railway-managed TLS)

## File Handling

- Filenames are sanitized: special characters removed (`apps/api/src/routes/documents.ts`)
- Upload size limit: 50MB (`@fastify/multipart` config in `apps/api/src/index.ts`)
- Accepted MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Signed upload URLs expire after 10 minutes
- Signed download URLs expire after 10 minutes

TODO: Confirm signed URL expiry times in `apps/api/src/routes/documents.ts` and `apps/api/src/routes/exports.ts`.

## Document Content

- Extracted text is sent to Claude API for classification and field extraction
- Text is capped at 20,000 characters (`apps/worker/src/lib/extractText.ts`)
- Claude API requests include document text and schema definitions
- Anthropic's data retention policy applies to API calls

TODO: Review Anthropic's data retention and privacy policy for compliance with Australian privacy law. Consider using the `anthropic-beta` header for zero-retention if handling sensitive documents.

## Known Gaps

1. **No RLS enforcement** - The API uses `service_role` key. If the API server is compromised, all data is accessible. See `docs/RLS_POLICY.md` for recommended policies.

2. **No rate limiting** - API endpoints have no rate limits. Consider adding `@fastify/rate-limit`.

3. **No audit logging** - No record of who accessed what and when beyond Supabase's built-in logs.

4. **No input sanitization beyond Zod** - SQL injection is mitigated by Supabase client (parameterized queries), but no explicit XSS sanitization on stored text fields.

5. **No CSRF protection** - The API uses Bearer tokens (not cookies) so CSRF is not applicable to API calls. The Supabase Auth cookie is `SameSite` protected.

6. **No encryption of extracted fields** - Sensitive PII (passport numbers, dates of birth) is stored in plaintext in the `extractions` and `flags` tables.

7. **Export ZIPs are not encrypted** - Downloaded ZIP files contain unprotected documents.

## Compliance Considerations

- The system processes Australian visa application documents which may contain sensitive personal information subject to the Australian Privacy Act 1988
- Document storage is in Supabase's hosted region — TODO: confirm Supabase project region
- Claude API processing happens on Anthropic's infrastructure — TODO: confirm data processing location
