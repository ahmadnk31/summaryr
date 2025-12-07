# Collaborative Practice - Complete Setup & Troubleshooting Guide

## 🚀 Quick Fix: Run All Migrations

If collaborative practice isn't working, run these SQL scripts **in order** in your Supabase SQL Editor:

### **Migration 1: Create Tables** ✅
File: `scripts/010_create_practice_sessions.sql`
- Creates practice_sessions, practice_session_participants, practice_session_responses tables
- Sets up initial RLS policies
- Creates helper functions

### **Migration 2: Add Score Function** ✅
File: `scripts/011_add_increment_score_function.sql`
- Creates increment_participant_score() function
- Required for updating scores in real-time

### **Migration 3: Fix Participants RLS** ✅
File: `scripts/012_fix_rls_recursion.sql`
- Fixes infinite recursion error
- Allows authenticated users to view participants

### **Migration 4: Fix Session Access** ✅
File: `scripts/013_fix_session_rls.sql`
- Allows participants to view sessions via shared link
- Fixes "Session not found" error

### **Migration 5: Allow Viewing Host's Items** ⚠️ CRITICAL
File: `scripts/014_allow_collaborative_access.sql`
- **This is the one you need to run NOW!**
- Allows participants to see host's flashcards/questions
- Fixes "Host hasn't created any flashcards" error when host HAS created them

---

## 🔥 IMMEDIATE ACTION REQUIRED

### Run This SQL Now:

```sql
-- Copy and paste this ENTIRE block into Supabase SQL Editor

-- Update RLS policies to allow collaborative practice sessions
-- Participants need to view the host's flashcards and questions

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can view their own questions" ON public.questions;

-- Create new policies that allow viewing own items OR items from session hosts
CREATE POLICY "Users can view their own flashcards or flashcards from sessions they're in" ON public.flashcards
  FOR SELECT USING (
    -- Users can view their own flashcards
    auth.uid() = user_id 
    OR
    -- Users can view flashcards from hosts of sessions they're participating in
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'flashcards'
    )
  );

CREATE POLICY "Users can view their own questions or questions from sessions they're in" ON public.questions
  FOR SELECT USING (
    -- Users can view their own questions
    auth.uid() = user_id 
    OR
    -- Users can view questions from hosts of sessions they're participating in
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'questions'
    )
  );

-- Also allow participants to update flashcards/questions during practice (for spaced repetition)
DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;

CREATE POLICY "Users can update their own flashcards or flashcards in active sessions" ON public.flashcards
  FOR UPDATE USING (
    -- Users can update their own flashcards
    auth.uid() = user_id 
    OR
    -- Users can update flashcards during active practice sessions
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'flashcards'
    )
  );

CREATE POLICY "Users can update their own questions or questions in active sessions" ON public.questions
  FOR UPDATE USING (
    -- Users can update their own questions
    auth.uid() = user_id 
    OR
    -- Users can update questions during active practice sessions
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'questions'
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('flashcards', 'questions')
  AND cmd IN ('SELECT', 'UPDATE')
ORDER BY tablename, cmd;
```

---

## ✅ After Running the Migration

### 1. **Verify It Worked**
Check the output of the last SELECT query. You should see 4 policies:
- `flashcards` - SELECT - "Users can view their own flashcards or flashcards from sessions they're in"
- `flashcards` - UPDATE - "Users can update their own flashcards or flashcards in active sessions"
- `questions` - SELECT - "Users can view their own questions or questions from sessions they're in"
- `questions` - UPDATE - "Users can update their own questions or questions in active sessions"

### 2. **Test the Feature**
1. **Refresh** both browser windows (host and participant)
2. Participant should now see the host's flashcards!
3. Both users should appear in the participants list
4. Practice together and see scores update in real-time

### 3. **Expected Behavior**
- ✅ Host sees their flashcards
- ✅ Participants see the SAME flashcards (from host)
- ✅ Everyone can rate and practice
- ✅ Scores update for everyone
- ✅ Leaderboard shows all participants
- ✅ Sound effects work (if enabled)

---

## 🐛 Still Having Issues?

### Issue: "No flashcards available" or "Host hasn't created any flashcards yet"

**Solution:** Run the SQL above! This is caused by RLS blocking access to host's items.

### Issue: "Session not found"

**Solution:** Run `scripts/013_fix_session_rls.sql`

### Issue: Participants count shows 0

**Solution:** Run `scripts/012_fix_rls_recursion.sql`

### Issue: Can't create session

**Solution:** Run `scripts/010_create_practice_sessions.sql` and `scripts/011_add_increment_score_function.sql`

---

## 📊 Complete Migration Checklist

Run in Supabase SQL Editor in this order:

- [ ] `010_create_practice_sessions.sql` - Base tables
- [ ] `011_add_increment_score_function.sql` - Score function
- [ ] `012_fix_rls_recursion.sql` - Fix participants RLS
- [ ] `013_fix_session_rls.sql` - Fix session access
- [ ] `014_allow_collaborative_access.sql` - **FIX HOST'S ITEMS ACCESS** ⭐

---

## 🎉 Success Criteria

Your collaborative practice is working when:

1. ✅ Host creates session with flashcards
2. ✅ Participant joins via link
3. ✅ Participant sees host's flashcards (same content)
4. ✅ Both users appear in participants list
5. ✅ Scores update in real-time
6. ✅ Leaderboard shows rankings
7. ✅ Practice together successfully

---

## 🔒 Security Notes

The new policies are secure because:
- ✅ Only works during **active sessions** (`is_active = true`)
- ✅ Must be a **participant** in the session
- ✅ Can't access random users' flashcards
- ✅ Access is **revoked** when session ends
- ✅ Can only **view/update**, not delete host's items

---

## 📝 One-Line Summary

**Run `014_allow_collaborative_access.sql` in Supabase SQL Editor to allow participants to see the host's flashcards/questions during active sessions.**

That's the fix! 🚀
