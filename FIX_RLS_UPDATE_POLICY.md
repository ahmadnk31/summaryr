# Fix for "Row Violates Row-Level Security Policy" Error

## Problem
When trying to end a session, you get this error:
```
Supabase update error: "new row violates row-level security policy for table \"practice_sessions\""
```

## Root Cause
The UPDATE policy on `practice_sessions` table was missing the `WITH CHECK` clause.

In PostgreSQL RLS, UPDATE operations require TWO checks:
1. **USING clause** - Can you SELECT the row? (checks old row)
2. **WITH CHECK clause** - Is the updated row still valid? (checks new row)

The original policy only had `USING`, so:
- ✅ You could select the session (you're the host)
- ❌ But the updated row failed the WITH CHECK (because it was missing)

## Solution

### Step 1: Apply the Migration
Run this in **Supabase SQL Editor**:

```sql
-- Copy and paste the contents of scripts/016_fix_update_rls_policy.sql
-- Or run it directly:

DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.practice_sessions;

CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE 
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);
```

### Step 2: Verify the Fix
Run this query to confirm the policy has both clauses:

```sql
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions' AND cmd = 'UPDATE';
```

**Expected result:**
- `using_clause`: `(auth.uid() = host_user_id)`
- `with_check_clause`: `(auth.uid() = host_user_id)`

Both should be populated!

### Step 3: Test Ending a Session
1. Refresh your browser (Ctrl+Shift+R)
2. Go to `/practice` → "Together" tab
3. Find an active session in your list
4. Click "End" button
5. Check console - should see: "Session ended successfully"

## Why This Happens

PostgreSQL UPDATE policies work like this:

```sql
-- OLD POLICY (broken):
FOR UPDATE USING (auth.uid() = host_user_id);
-- Can SELECT rows ✅
-- Can't UPDATE because WITH CHECK defaults to USING, 
-- and the check happens AFTER the update changes the row

-- NEW POLICY (fixed):
FOR UPDATE 
  USING (auth.uid() = host_user_id)      -- Check before update
  WITH CHECK (auth.uid() = host_user_id); -- Check after update
-- Both checks pass ✅
```

## Testing Checklist

After applying the fix:

- [ ] Can end active sessions from the list
- [ ] Session `is_active` changes to `false` in database
- [ ] All participants are notified and redirected
- [ ] No more RLS policy errors in console
- [ ] Can delete ended sessions

## Related Files

- **Migration**: `scripts/016_fix_update_rls_policy.sql`
- **Component**: `components/user-sessions-list.tsx` (has detailed error logging)
- **Original Schema**: `scripts/010_create_practice_sessions.sql`

## Debug Commands

If still not working after migration:

```sql
-- 1. Check current policy
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'practice_sessions' AND cmd = 'UPDATE';

-- 2. Try manual update
UPDATE practice_sessions 
SET is_active = false 
WHERE id = 'YOUR_SESSION_ID' 
AND host_user_id = auth.uid();

-- 3. Check your user ID
SELECT auth.uid();

-- 4. Verify session ownership
SELECT id, host_user_id, auth.uid() as your_id
FROM practice_sessions 
WHERE id = 'YOUR_SESSION_ID';
```

## Common Questions

**Q: Why didn't the INSERT policy need WITH CHECK?**
A: INSERT policies default to using the WITH CHECK for both clauses.

**Q: Will this affect existing sessions?**
A: No, this only fixes the UPDATE permission. Existing data is unchanged.

**Q: Do I need to restart my app?**
A: No, just refresh the browser. Database policies take effect immediately.

---

**Status**: 🔧 Migration ready to apply
**Priority**: HIGH - Blocks core functionality
**Estimated time**: 30 seconds to apply
