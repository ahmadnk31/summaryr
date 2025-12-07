## 🎯 ROOT CAUSE IDENTIFIED!

### The Real Problem

The issue is **NOT just the UPDATE policy** - it's the **SELECT policy combined with the UPDATE**!

Here's what's happening:

```sql
-- CURRENT SELECT POLICY (BROKEN):
CREATE POLICY "Authenticated users can view active sessions"
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true  ❌
  );
```

**The Problem Chain:**
1. You try to UPDATE `is_active` from `true` → `false`
2. PostgreSQL checks the UPDATE policy: ✅ PASS (you're the host)
3. PostgreSQL performs the update in memory
4. PostgreSQL checks if the UPDATED row still passes the WITH CHECK: ✅ PASS
5. **But then** PostgreSQL checks if the row still passes the SELECT policy
6. The row now has `is_active = false` ❌ FAIL
7. Error: "new row violates row-level security policy"

### The Solution

Update the SELECT policy to allow hosts to see **ALL** their sessions (not just active ones):

```sql
-- NEW SELECT POLICY (FIXED):
CREATE POLICY "Users can view sessions"
  FOR SELECT USING (
    auth.uid() = host_user_id  -- ✅ Hosts see ALL their sessions
    OR 
    (auth.uid() IS NOT NULL AND is_active = true)  -- Others see active sessions only
  );
```

### Apply The Complete Fix

Run **`scripts/017_fix_select_policy_complete.sql`** in Supabase SQL Editor.

This migration:
1. ✅ Drops the restrictive SELECT policy
2. ✅ Creates new SELECT policy that lets hosts see all their sessions
3. ✅ Fixes the UPDATE policy (if not already done)
4. ✅ Verifies everything is correct

### Why This Wasn't Obvious

The error message says "row violates policy" but doesn't tell you **which** policy (SELECT, UPDATE, or WITH CHECK). The UPDATE policy looked correct, but the SELECT policy was also being checked!

### After Applying

1. Refresh your browser
2. Go to `/practice` → "Together" tab
3. Click "End" on any active session
4. ✅ Should work immediately!

### Testing

Run this in Supabase SQL Editor after applying the migration:

```sql
-- Should work now!
UPDATE practice_sessions 
SET is_active = false 
WHERE host_user_id = auth.uid() 
AND is_active = true
LIMIT 1
RETURNING id, session_code, is_active;
```

---

**TL;DR**: The SELECT policy was too restrictive. It only allowed viewing `is_active = true` sessions, so when you tried to set `is_active = false`, the updated row failed the SELECT check.
