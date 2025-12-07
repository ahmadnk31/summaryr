# Collaborative Practice Sessions

Transform your solo study experience into a social learning adventure! Practice flashcards and questions together with friends, classmates, or study groups in real-time.

## ✨ Features

- **Create Study Sessions**: Host practice sessions with custom names and share a 6-character code
- **Join Sessions**: Enter a session code to join a collaborative study group
- **Real-time Participation**: See all participants and their scores update live
- **Leaderboard**: Compete with friends on a live leaderboard with rankings
- **Session Types**: Choose between flashcard or question practice modes
- **Document Filter**: Practice from a specific document or all your documents
- **Session Management**: Hosts can end sessions, participants can leave anytime
- **Score System**: Earn points based on performance (Perfect: 100pts, Good: 75pts, Hard: 50pts)
- **Active Status**: See who's actively participating with real-time indicators
- **Sound Effects**: Optional audio feedback for each answer (can be toggled)

## 🚀 How to Use

### Creating a Session

1. Navigate to the **Practice** page
2. Click on the **Together** tab
3. Fill in the session details:
   - **Session Name**: e.g., "Study Group - Chapter 5"
   - **Practice Type**: Choose Flashcards or Questions
   - **Document**: Select a specific document or practice from all
4. Click **Create Session**
5. Share the generated 6-character code with others
6. Click **Start Session** when ready

### Joining a Session

**Method 1: From the Practice Page**
1. Go to **Practice** → **Together** tab
2. Enter the 6-character session code
3. Optionally add your display name
4. Click **Join Session**

**Method 2: Via Share Link**
1. Click the shared link from the host
2. You'll be automatically redirected to the session

### During a Session

- **Practice Together**: All participants see the same flashcards/questions
- **Rate Performance**: Use the four rating buttons (Again, Hard, Good, Perfect)
- **Track Progress**: View your score and ranking on the live leaderboard
- **Earn Points**:
  - 🟢 Perfect (5): 100 points
  - 🔵 Good (4): 75 points
  - 🟠 Hard (3): 50 points
  - 🔴 Again (0): 0 points
- **Toggle Sound**: Use the volume button to enable/disable audio feedback
- **End Session**: Hosts can end the session for everyone

### Session Details

- **Max Participants**: Up to 10 people per session
- **Session Duration**: 24 hours (automatic cleanup)
- **Host Controls**: Only the host can end the session
- **Active Indicators**: Green dot shows who's actively participating (within last 30 seconds)
- **Progress Tracking**: Individual progress bars and completion stats

## 🎯 Scoring System

Points are awarded based on your spaced repetition rating:

| Rating | Description | Points |
|--------|-------------|--------|
| Perfect (5) | Instant recall, no hesitation | 100 |
| Good (4) | Correct after some thought | 75 |
| Hard (3) | Difficult but eventually remembered | 50 |
| Again (0) | Didn't remember | 0 |

## 🔧 Database Schema

### Tables

#### `practice_sessions`
Stores collaborative practice session information.

```sql
- id (uuid, primary key)
- host_user_id (uuid, references auth.users)
- document_id (uuid, nullable, references documents)
- session_type (text: 'flashcards' or 'questions')
- session_name (text)
- session_code (text, unique, 6 characters)
- max_participants (integer, default 10)
- is_active (boolean, default true)
- created_at (timestamp)
- expires_at (timestamp, default now() + 24 hours)
```

#### `practice_session_participants`
Tracks who has joined each session.

```sql
- id (uuid, primary key)
- session_id (uuid, references practice_sessions)
- user_id (uuid, references auth.users)
- display_name (text)
- joined_at (timestamp)
- last_active_at (timestamp)
- score (integer, default 0)
```

#### `practice_session_responses`
Records individual responses during sessions.

```sql
- id (uuid, primary key)
- session_id (uuid, references practice_sessions)
- participant_id (uuid, references practice_session_participants)
- item_id (uuid)
- item_type (text: 'flashcard' or 'question')
- quality (integer, 0-5)
- response_time_ms (integer)
- responded_at (timestamp)
```

## 🔐 Security Features

- **Row Level Security (RLS)**: All tables have RLS policies enabled
- **User Authentication**: Only authenticated users can create/join sessions
- **Session Validation**: Codes are validated before joining
- **Participant Limits**: Maximum 10 participants per session
- **Auto-Cleanup**: Expired sessions are automatically removed
- **Host Controls**: Only hosts can end sessions early

## 📊 Real-time Features

The collaborative practice uses Supabase real-time subscriptions to provide:

- **Live Participant List**: See who joins/leaves in real-time
- **Score Updates**: Leaderboard updates automatically
- **Session Status**: Know when a session ends
- **Active Indicators**: See who's currently practicing

## 🎨 UI Components

### Key Components

1. **CreatePracticeSession** (`components/create-practice-session.tsx`)
   - Session creation form
   - Code generation and sharing
   - Document selection

2. **JoinPracticeSession** (`components/join-practice-session.tsx`)
   - Code entry interface
   - Session validation
   - Display name input

3. **PracticeSessionParticipants** (`components/practice-session-participants.tsx`)
   - Live participant list
   - Leaderboard with rankings
   - Active status indicators
   - Host badge display

4. **CollaborativePracticeSession** (`components/collaborative-practice-session.tsx`)
   - Main practice interface
   - Real-time synchronization
   - Sound effects integration
   - Spaced repetition algorithm

## 🔄 Setup Instructions

### 1. Run Database Migrations

Execute the following SQL scripts in order:

```bash
# Create practice sessions tables
psql -f scripts/010_create_practice_sessions.sql

# Add score increment function
psql -f scripts/011_add_increment_score_function.sql
```

### 2. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Enable Realtime

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for:
   - `practice_sessions`
   - `practice_session_participants`
   - `practice_session_responses`

## 🎓 Best Practices

### For Hosts

- Choose descriptive session names
- Share codes through secure channels
- Monitor participant activity
- End sessions when complete to free resources

### For Participants

- Use recognizable display names
- Stay active during sessions
- Be honest with ratings for optimal learning
- Toggle sound if in a quiet environment

### For Better Learning

- Keep sessions focused (20-30 minutes)
- Practice with similar skill levels for best experience
- Use the "Hard" rating to identify weak areas
- Review together after the session

## 🐛 Troubleshooting

### "Session not found"
- Check if the code is correct (6 characters, case-sensitive)
- Session may have expired (24-hour limit)
- Host may have ended the session

### "Session is full"
- Maximum 10 participants per session
- Ask host to create a new session

### Can't see other participants
- Check your internet connection
- Ensure Supabase realtime is enabled
- Try refreshing the page

### Scores not updating
- Verify you're rating each item
- Check for network issues
- Ensure you've joined the session properly

## 🔮 Future Enhancements

Potential features for future versions:

- [ ] Video/voice chat integration
- [ ] Custom participant limits
- [ ] Session recording and replay
- [ ] Team modes (collaborative vs competitive)
- [ ] Session analytics and insights
- [ ] Private sessions with passwords
- [ ] Scheduled sessions
- [ ] Session templates
- [ ] Export session results
- [ ] Mobile app support

## 📝 Technical Notes

### Session Code Generation

Codes are 6 characters long using this character set:
- Letters: A-Z (excluding I, O to avoid confusion with 1, 0)
- Numbers: 2-9 (excluding 0, 1)

This provides ~2.1 billion possible combinations.

### Cleanup

The `cleanup_expired_sessions()` function automatically:
- Marks expired sessions as inactive
- Runs on a schedule (can be set up with pg_cron)
- Prevents database bloat

### Performance

- Indexes on frequently queried fields
- RLS policies optimized for performance
- Real-time subscriptions use targeted filters
- Participant count cached in session row

## 🤝 Contributing

To add features or fix bugs:

1. Test database changes locally first
2. Update relevant components
3. Add/update documentation
4. Test real-time functionality with multiple users
5. Verify RLS policies work correctly

---

**Happy collaborative studying! 📚✨**
