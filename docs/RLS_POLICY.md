# Row Level Security (RLS) Policies

Platform: **Supabase** (PostgreSQL)

## Current State

The API server uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS entirely**. All authorization is enforced in application code:

- `apps/api/src/lib/auth.ts` validates the JWT and extracts `userId`
- `verifyCaseOwnership()` checks `cases.user_id = userId` before allowing access
- All case-scoped routes call this check

The frontend Supabase client uses `SUPABASE_ANON_KEY` for authentication only (sign-in, sign-up, session management). It does **not** query the database directly; all data access goes through the API.

## Recommended RLS Policies

TODO: Confirm which of these policies are already enabled in the Supabase dashboard.

### cases

```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cases
CREATE POLICY "Users can view own cases"
  ON cases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create cases for themselves
CREATE POLICY "Users can insert own cases"
  ON cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own cases
CREATE POLICY "Users can update own cases"
  ON cases FOR UPDATE
  USING (auth.uid() = user_id);
```

### quiz_responses

```sql
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quiz responses"
  ON quiz_responses FOR ALL
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );
```

### documents

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON documents FOR ALL
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );
```

### flags

```sql
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and resolve own flags"
  ON flags FOR ALL
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );
```

### exports

```sql
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exports"
  ON exports FOR ALL
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );
```

### extractions

```sql
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extractions"
  ON extractions FOR SELECT
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );
```

## Storage Bucket Policies

TODO: Confirm storage policies in Supabase dashboard.

### sheila-docs

```sql
-- Users can upload to their own case path
CREATE POLICY "Users can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sheila-docs'
    AND (storage.foldername(name))[1] = 'cases'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM cases WHERE user_id = auth.uid()
    )
  );

-- Users can read their own docs
CREATE POLICY "Users can read own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sheila-docs'
    AND (storage.foldername(name))[1] = 'cases'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM cases WHERE user_id = auth.uid()
    )
  );
```

### sheila-exports

```sql
-- Exports are read-only for users (worker writes with service_role)
CREATE POLICY "Users can read own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sheila-exports'
    AND (storage.foldername(name))[1] = 'exports'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM cases WHERE user_id = auth.uid()
    )
  );
```

## Service Role Access

The `service_role` key is used by the API and worker to bypass RLS for:

- Creating/updating documents and flags during background processing
- Writing export ZIPs to storage
- Recomputing case status across tables
- Upserting quiz responses

This is necessary because background workers do not have a user JWT context.

## Risk Notes

- If RLS is disabled on any table, a compromised `anon` key would expose all rows. Since the frontend only uses the anon key for auth (not direct DB queries), the blast radius is limited to Supabase Auth operations.
- The `service_role` key must never be exposed to the client. It is only used server-side in `apps/api` and `apps/worker`.
