# User Sessions List - Feature Documentation

## Overview
Added a new component that displays all practice sessions created by the logged-in user, with management capabilities.

## Features

### 📋 Session List Display
- Shows all sessions created by the current user
- Ordered by creation date (newest first)
- Displays session details:
  - Session name and type (flashcards/questions)
  - Session code (for sharing)
  - Active/Ended status badge
  - Number of participants
  - Time created (relative, e.g., "2 hours ago")

### 🎮 Session Management Actions

#### For Active Sessions:
- **Copy Link** - Copies shareable session link to clipboard
- **Join** - Opens session in new tab (host can join their own session)
- **End** - Ends the session for all participants
  - Updates `is_active` to `false`
  - Triggers real-time notification to all participants
  - All participants redirected to practice page

#### For Ended Sessions:
- **Delete** - Removes the session from database
  - Cascade deletes all participants and responses
  - Cleans up old session data

### 🔄 Real-time Features
- **Refresh Button** - Manually reload session list
- **Auto-updates** - Reflects changes when sessions are ended/created
- **Participant Count** - Shows current number of active participants

## Location
**Page**: `/practice` → "Together" tab

The list appears below the "Create" and "Join" session cards.

## Component Details

**File**: `components/user-sessions-list.tsx`

### Key Functions:
```typescript
loadSessions()      // Fetches all user's sessions from database
copySessionLink()   // Copies session URL to clipboard
endSession()        // Ends active session (sets is_active = false)
deleteSession()     // Permanently deletes session
```

### Data Structure:
```typescript
interface Session {
  id: string
  session_code: string
  session_name: string
  session_type: "flashcards" | "questions"
  is_active: boolean
  created_at: string
  expires_at: string
  participant_count?: number
}
```

## SQL Queries

For manual database inspection, use `scripts/LIST_USER_SESSIONS.sql`:

```sql
-- See all your sessions with participant count
SELECT ps.session_code, ps.session_name, COUNT(psp.id) as participants
FROM practice_sessions ps
LEFT JOIN practice_session_participants psp ON ps.id = psp.session_id
WHERE ps.host_user_id = auth.uid()
GROUP BY ps.id
ORDER BY ps.created_at DESC;
```

## UI/UX Details

### Empty State
When user has no sessions:
- Shows message: "You haven't created any sessions yet"
- Helpful hint: "Create a session from the 'Together' tab"

### Session Card Layout
```
┌─────────────────────────────────────────────────────────┐
│ Session Name [Active] [flashcards]                      │
│ 👥 2 participants  🕐 2 hours ago  [ABC123]             │
│                              [Copy Link] [Join] [End]   │
└─────────────────────────────────────────────────────────┘
```

### Status Badges
- **Active** (blue badge) - Session is currently running
- **Ended** (gray badge) - Session has finished

## Testing Checklist

### ✅ Display Tests
- [ ] List shows all user's sessions
- [ ] Session details display correctly
- [ ] Participant count is accurate
- [ ] Active/Ended status shows correctly
- [ ] Empty state shows when no sessions

### ✅ Action Tests
- [ ] Copy Link copies correct URL
- [ ] Join opens session in new tab
- [ ] End button updates `is_active` to false
- [ ] End triggers real-time notification
- [ ] Delete removes session from list
- [ ] Refresh button reloads data

### ✅ Permissions Tests
- [ ] Users only see their own sessions
- [ ] Only host can end session
- [ ] Only host can delete session

## Debug Commands

### Check session status
```sql
SELECT id, session_code, is_active, host_user_id
FROM practice_sessions
WHERE session_code = 'YOUR_CODE';
```

### Manually end a session
```sql
UPDATE practice_sessions 
SET is_active = false 
WHERE id = 'SESSION_ID' 
AND host_user_id = auth.uid();
```

### View participant count
```sql
SELECT ps.session_code, COUNT(psp.id) as participant_count
FROM practice_sessions ps
LEFT JOIN practice_session_participants psp ON ps.id = psp.session_id
WHERE ps.host_user_id = auth.uid()
GROUP BY ps.id, ps.session_code;
```

## Integration Points

### With Other Components:
1. **CreatePracticeSession** - Creates sessions that appear in this list
2. **JoinPracticeSession** - Joins sessions shown here
3. **CollaborativePracticeSession** - The active session page

### Database Tables:
- `practice_sessions` - Main session data
- `practice_session_participants` - For participant count
- Joins both tables to show complete information

## Common Issues

### Issue: Session not appearing in list
**Cause**: User is not the host
**Solution**: Only sessions where `host_user_id = current_user_id` are shown

### Issue: Participant count is 0 but people joined
**Cause**: Real-time sync delay or query issue
**Solution**: Click refresh button, or check database directly

### Issue: "End" button doesn't work
**Cause**: RLS policy or user ID mismatch
**Solution**: Check console logs (now includes detailed error messages)

### Issue: Can't delete ended session
**Cause**: Foreign key constraints or RLS
**Solution**: Run migration `015_improve_session_cleanup.sql` for CASCADE DELETE

## Future Enhancements

Potential additions:
- [ ] Pagination for users with many sessions
- [ ] Filter by active/ended/type
- [ ] Search by session name/code
- [ ] Export session results/statistics
- [ ] Reactivate ended sessions
- [ ] Session templates (save settings for reuse)
- [ ] Session analytics (who performed best, etc.)

## Performance Notes

- Uses single query with LEFT JOIN for efficiency
- Participant count calculated in query (not separate requests)
- Real-time updates handled by component re-rendering
- Index exists on `host_user_id` for fast filtering

---

**Status**: ✅ Implemented and ready to use
**Last Updated**: December 7, 2025
