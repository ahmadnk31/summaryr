# Session End Synchronization - Quick Guide

## What's Changed

When the host ends a session, all participants are now automatically:
1. **Notified** - They see "Host has ended the session" message
2. **Redirected** - Automatically redirected to practice page after 2 seconds
3. **Removed** - Their participant records are cleaned up from the database

## Features Added

### 1. Real-time Session End Detection
- All participants subscribe to session status changes
- When host clicks "End Session", everyone is notified immediately
- Automatic redirect prevents participants from staying in ended sessions

### 2. Session Access Protection
- Users cannot join sessions that have already ended
- If someone tries to access an ended session via link, they see "This session has ended"

### 3. Leave vs End Session
- **Host**: Sees "End Session" button (red) - ends session for everyone
- **Participants**: See "Leave Session" button - only leaves for themselves

### 4. Database Cleanup
- When host ends session, all participants are removed
- Cascade deletes ensure responses are cleaned up too
- Old inactive sessions (>7 days) can be automatically cleaned up

## Testing Instructions

### Test 1: Host Ends Session
1. **Host Browser**: Start a practice session
2. **Participant Browser**: Join the session
3. **Host**: Click "End Session" button
4. **Expected Result**: 
   - Both see "Host has ended the session" toast
   - Both are redirected to /practice after 2 seconds
   - Session is marked `is_active = false` in database

### Test 2: Trying to Join Ended Session
1. **Host**: Create and end a session
2. **Participant**: Try to join using the session code
3. **Expected Result**: 
   - See "This session has ended" error message
   - Redirected to practice page

### Test 3: Participant Leaves (Without Ending)
1. **Host**: Start a practice session
2. **Participant**: Join the session
3. **Participant**: Click "Leave Session" button
4. **Expected Result**:
   - Participant is redirected to /practice
   - Host and other participants continue the session
   - Session remains active

## Apply the Database Migration

Run this migration in Supabase SQL Editor:

```sql
-- Run scripts/015_improve_session_cleanup.sql
```

This adds:
- CASCADE DELETE for better cleanup
- Indexes for performance
- Optional cleanup function for old sessions

## Code Changes Summary

**File: `components/collaborative-practice-session.tsx`**

1. **Enhanced subscription handler** (line ~73-91):
   ```typescript
   if (!updatedSession.is_active) {
     setSessionEnded(true)
     toast.info("Host has ended the session")
     setTimeout(() => {
       router.push("/practice")
     }, 2000)
   }
   ```

2. **Check if session is active** (line ~117-122):
   ```typescript
   if (!sessionData.is_active) {
     toast.error("This session has ended")
     router.push("/practice")
     return
   }
   ```

3. **Improved endSession function** (line ~306-325):
   ```typescript
   // End the session (triggers real-time update)
   await supabase
     .from("practice_sessions")
     .update({ is_active: false })
     .eq("id", session.id)

   // Remove all participants (cleanup)
   await supabase
     .from("practice_session_participants")
     .delete()
     .eq("session_id", session.id)
   ```

4. **Leave button for non-hosts** (line ~388-398):
   ```typescript
   {userId === session.host_user_id ? (
     <Button variant="destructive" onClick={endSession}>
       End Session
     </Button>
   ) : (
     <Button variant="outline" onClick={() => router.push("/practice")}>
       Leave Session
     </Button>
   )}
   ```

## How It Works

### Real-time Flow
```
Host clicks "End Session"
    ↓
Update practice_sessions.is_active = false
    ↓
Supabase broadcasts change to all subscribers
    ↓
All clients receive UPDATE event
    ↓
Show toast + redirect after 2s
```

### Database Cleanup
```
Host ends session
    ↓
Delete all practice_session_participants
    ↓
CASCADE DELETE removes all practice_session_responses
    ↓
Clean slate for next session
```

## Troubleshooting

### Participants Not Redirected
- **Check**: Browser console for errors
- **Verify**: Supabase real-time is enabled for `practice_sessions` table
- **Test**: Run in Supabase SQL Editor:
  ```sql
  SELECT * FROM practice_sessions WHERE session_code = 'YOUR_CODE';
  ```

### Session Still Accessible After Ending
- **Check**: `is_active` field in database (should be `false`)
- **Verify**: Migration 015 ran successfully
- **Clear**: Browser cache and reload

### Leave Button Not Showing
- **Check**: User is NOT the host
- **Verify**: `userId !== session.host_user_id`
- **Debug**: Add `console.log('userId:', userId, 'hostId:', session.host_user_id)`

## Next Steps

1. ✅ Apply migration `015_improve_session_cleanup.sql`
2. ✅ Test with 2+ browser windows
3. ✅ Verify real-time updates work
4. ✅ Check database cleanup after ending session

## Optional Enhancements

### Auto-cleanup Old Sessions
If you have `pg_cron` extension enabled, uncomment this in migration:
```sql
SELECT cron.schedule('cleanup-old-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions()');
```

### Manual Cleanup
Run this to clean up old sessions manually:
```sql
SELECT cleanup_old_sessions();
```

This removes inactive sessions older than 7 days and all their related data.

---

**Status**: ✅ Ready to test
**Impact**: All participants are now properly synchronized when sessions end
