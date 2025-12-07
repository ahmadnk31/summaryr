# Debug Collaborative Practice - Quick Checks

## Run these queries in Supabase SQL Editor to diagnose the issue:

### 1. Check if policies were created correctly
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('flashcards', 'questions')
ORDER BY tablename, cmd;
```
**Expected:** Should see 4-6 policies including ones with "sessions" in the name

---

### 2. Check if session exists and is active
```sql
SELECT 
  session_code,
  session_name,
  session_type,
  is_active,
  host_user_id,
  document_id,
  created_at
FROM practice_sessions 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
```
**Expected:** Should see your session with `is_active = true`

---

### 3. Check if participants were added
```sql
SELECT 
  ps.session_code,
  ps.session_name,
  psp.display_name,
  psp.user_id,
  psp.score,
  psp.joined_at
FROM practice_sessions ps
JOIN practice_session_participants psp ON ps.id = psp.session_id
WHERE ps.is_active = true
ORDER BY ps.created_at DESC;
```
**Expected:** Should see both host and participant

---

### 4. Check if host has flashcards/questions
```sql
-- For flashcards
SELECT 
  u.email as owner_email,
  COUNT(*) as flashcard_count,
  f.document_id
FROM flashcards f
JOIN auth.users u ON f.user_id = u.id
GROUP BY u.email, f.document_id;

-- For questions  
SELECT 
  u.email as owner_email,
  COUNT(*) as question_count,
  q.document_id
FROM questions q
JOIN auth.users u ON q.user_id = u.id
GROUP BY u.email, q.document_id;
```
**Expected:** Should see flashcards for the host's email

---

### 5. Test if participant can access host's items
```sql
-- Replace with your actual values
SET app.current_user_id = 'participant-user-id-here';

-- Try to select host's flashcards as participant
SELECT 
  f.id,
  f.front_text,
  f.back_text,
  f.user_id as owner_id
FROM flashcards f
WHERE f.user_id IN (
  SELECT ps.host_user_id 
  FROM practice_sessions ps
  JOIN practice_session_participants psp ON ps.id = psp.session_id
  WHERE psp.user_id = current_setting('app.current_user_id')::uuid
    AND ps.is_active = true
    AND ps.session_type = 'flashcards'
);
```

---

## Common Issues & Fixes

### Issue 1: "No policies found with 'sessions' in name"
**Problem:** Migration didn't run completely
**Fix:** Run `014_allow_collaborative_access.sql` again

### Issue 2: "Session exists but is_active = false"
**Problem:** Session expired or was ended
**Fix:** Create a new session

### Issue 3: "No participants found"
**Problem:** Participant didn't get added when joining
**Fix:** Check console for errors, verify `012_fix_rls_recursion.sql` was run

### Issue 4: "Host has no flashcards"
**Problem:** Flashcards weren't created or wrong document
**Fix:** Go to Documents → Generate Flashcards

### Issue 5: "Query returns 0 rows for participant"
**Problem:** RLS policy not working correctly
**Fix:** Check if realtime is enabled, refresh page

---

## Quick Test Procedure

### In Browser 1 (Host):
1. Open DevTools Console (F12)
2. Go to session page
3. Look for: `"Loaded X flashcards from host's collection"`
4. Check: `"Loaded Y participants for session..."`

### In Browser 2 (Participant):
1. Open DevTools Console (F12)
2. Join session
3. Look for: `"Loaded X flashcards from host's collection"`
4. Check: `"Loaded Y participants for session..."`

### If Console Shows:
- ✅ `"Loaded 5 flashcards..."` → RLS is working, flashcards should display
- ❌ `"Loaded 0 flashcards..."` → RLS policy issue or no flashcards exist
- ❌ `"Error loading items..."` → Check the error details

---

## Nuclear Option: Reset Everything

If nothing works, run this to start fresh:

```sql
-- WARNING: This deletes all sessions and participants!
DELETE FROM practice_session_responses;
DELETE FROM practice_session_participants;
DELETE FROM practice_sessions;

-- Then recreate the session
```

---

## Enable Realtime (If Not Done)

1. Supabase Dashboard → **Database** → **Replication**
2. Toggle ON for:
   - ✅ `practice_sessions`
   - ✅ `practice_session_participants`
   - ✅ `practice_session_responses`

---

## Success Checklist

Run through this after making changes:

- [ ] All 5 migrations run successfully
- [ ] Policies show in pg_policies query
- [ ] Session is active (`is_active = true`)
- [ ] Both users in participants table
- [ ] Host has flashcards in database
- [ ] Realtime enabled for all tables
- [ ] Console shows "Loaded X flashcards..."
- [ ] Both browsers refreshed

If all checked, it MUST work! 🎉
