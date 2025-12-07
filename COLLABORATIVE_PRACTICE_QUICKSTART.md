# Collaborative Practice - Quick Start Guide

Get started with collaborative study sessions in just 5 minutes!

## 🚀 Quick Setup

### Step 1: Run Database Migrations

```bash
# Navigate to your project
cd /path/to/your/project

# Copy and run the SQL scripts in your Supabase SQL editor
# Or if using psql:
psql -h your-db-host -U your-user -d your-database -f scripts/010_create_practice_sessions.sql
psql -h your-db-host -U your-user -d your-database -f scripts/011_add_increment_score_function.sql
```

**Or via Supabase Dashboard:**

1. Go to SQL Editor
2. Copy contents of `scripts/010_create_practice_sessions.sql`
3. Run it
4. Copy contents of `scripts/011_add_increment_score_function.sql`
5. Run it

### Step 2: Enable Realtime (Important!)

1. Go to Supabase Dashboard → Database → Replication
2. Toggle ON for these tables:
   - ✅ `practice_sessions`
   - ✅ `practice_session_participants`
   - ✅ `practice_session_responses`

### Step 3: Start Your Dev Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

## 📖 Using the Feature

### Creating Your First Session (30 seconds)

1. **Navigate**: Go to `/practice` → Click **"Together"** tab
2. **Fill Form**:
   - Session Name: "My First Study Session"
   - Practice Type: Flashcards
   - Document: Any document (or leave blank for all)
3. **Create**: Click "Create Session"
4. **Share**: Copy the 6-character code or full link
5. **Start**: Click "Start Session"

### Joining a Session (15 seconds)

**If you have a link:**
- Just click it! Auto-joins.

**If you have a code:**
1. Go to `/practice` → **"Together"** tab
2. Enter the code (e.g., ABC123)
3. Add your name (optional)
4. Click "Join Session"

## 🎮 Practice Together

Once in a session:

1. **View Cards**: Click to flip flashcard or question
2. **Rate Performance**: 
   - 🔴 Again (0 pts) - Didn't remember
   - 🟠 Hard (50 pts) - Hard to remember
   - 🔵 Good (75 pts) - Remembered with thought
   - 🟢 Perfect (100 pts) - Instant recall
3. **Check Leaderboard**: See everyone's scores on the right
4. **Toggle Sound**: Click volume icon to enable/disable sounds

## 🎯 Quick Tips

### For Best Results:
- ✅ Practice in 20-30 minute sessions
- ✅ Use descriptive session names
- ✅ Be honest with ratings (helps learning!)
- ✅ Study with 2-5 people for best experience

### Common Codes:
```
Session expires: 24 hours
Max participants: 10 people
Code format: 6 characters (e.g., A3B7K9)
```

## 🔍 Testing Locally

Want to test with multiple users?

1. Open browser in incognito/private mode
2. Sign in as different user
3. Join the same session
4. Practice on both windows side-by-side!

## ⚡ Routes Quick Reference

| Route | Description |
|-------|-------------|
| `/practice` | Main practice page with "Together" tab |
| `/practice/join?code=ABC123` | Auto-join with code |
| `/practice/session/ABC123` | Active session page |

## 🐛 Troubleshooting

### Session code doesn't work?
- Make sure it's exactly 6 characters
- Codes are case-sensitive
- Session may have expired (24h limit)

### Can't see other participants?
- Check internet connection
- Verify realtime is enabled in Supabase
- Refresh the page

### Scores not updating?
- Ensure you're rating each card
- Check network tab for errors
- Verify database functions were created

## 📊 Database Quick Check

Verify everything is set up:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('practice_sessions', 'practice_session_participants', 'practice_session_responses');

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_participant_score';

-- Test creating a session (will fail if not authenticated, but shows permissions)
SELECT * FROM practice_sessions LIMIT 1;
```

## 🎉 You're Ready!

That's it! You now have a fully functional collaborative practice system. 

**Next Steps:**
- Create your first session
- Invite a friend
- Start practicing together!

For more details, see [COLLABORATIVE_PRACTICE.md](./COLLABORATIVE_PRACTICE.md)

---

**Need Help?** Check the main documentation or open an issue on GitHub.
