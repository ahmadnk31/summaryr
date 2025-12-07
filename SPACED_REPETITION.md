# Spaced Repetition System

This project now includes a complete spaced repetition system for flashcards and questions using the SM-2 (SuperMemo 2) algorithm.

## Features

- **Intelligent Scheduling**: Cards are automatically scheduled for optimal review intervals
- **Performance Tracking**: Tracks your performance on each card
- **Adaptive Difficulty**: Adjusts review frequency based on how well you know each card
- **Review History**: Keeps a complete history of all your reviews
- **Study Statistics**: View your progress with detailed stats

## Setup

### 1. Run the Database Migration

Execute the SQL migration to add spaced repetition support:

```bash
# Run this in your Supabase SQL editor or via CLI
psql -h your-db-host -U postgres -d postgres -f scripts/009_add_spaced_repetition.sql
```

Or copy the contents of `scripts/009_add_spaced_repetition.sql` and run it in the Supabase dashboard SQL editor.

### 2. Use the Practice Components

#### Option A: Use the Complete Practice Page

Navigate to `/practice` to access the full study interface with flashcards, questions, and statistics.

#### Option B: Add Components Individually

Add the practice components to your dashboard or document pages:

```tsx
import { PracticeFlashcards } from "@/components/practice-flashcards"
import { PracticeQuestions } from "@/components/practice-questions"
import { StudyStatsDashboard } from "@/components/study-stats-dashboard"

// For all flashcards
<PracticeFlashcards />

// For a specific document
<PracticeFlashcards documentId={documentId} />

// For questions
<PracticeQuestions />
<PracticeQuestions documentId={documentId} />

// For statistics
<StudyStatsDashboard />
```

## How It Works

### SM-2 Algorithm

The system uses the SM-2 algorithm, which schedules reviews based on:

1. **Repetition Count**: How many times you've reviewed the card
2. **Easiness Factor**: How easy/hard the card is for you (1.3 - 2.5)
3. **Interval**: Days until next review

### Quality Ratings

When you review a card, you rate your performance:

- **Easy (5)**: Perfect recall, no hesitation
- **Good (4)**: Correct after brief thought
- **Hard (3)**: Correct but difficult
- **Again (0)**: Incorrect, need to review again soon

### Review Schedule

- First review: 1 day
- Second review: 6 days
- Subsequent reviews: Calculated based on previous interval × easiness factor
- If you get it wrong (quality < 3): Reset to 1 day

## API Usage

### Calculate Next Review

```typescript
import { calculateNextReview, QualityPresets } from "@/lib/spaced-repetition"

const result = calculateNextReview(QualityPresets.GOOD, {
  repetitionCount: 2,
  easinessFactor: 2.5,
  intervalDays: 6,
  nextReviewDate: new Date(),
})

console.log(result)
// {
//   repetitionCount: 3,
//   easinessFactor: 2.6,
//   intervalDays: 16,
//   nextReviewDate: Date (16 days from now),
//   lastReviewedAt: Date (now)
// }
```

### Get Due Items

```typescript
import { getDueItems } from "@/lib/spaced-repetition"

const dueFlashcards = getDueItems(allFlashcards)
// Returns only flashcards due for review
```

### Calculate Study Stats

```typescript
import { calculateStudyStats } from "@/lib/spaced-repetition"

const stats = calculateStudyStats(flashcards)
console.log(stats)
// {
//   totalItems: 50,
//   dueToday: 12,
//   reviewedToday: 8,
//   averageEasiness: 2.45,
//   masteredItems: 15
// }
```

## Database Schema

### New Columns Added

Both `flashcards` and `questions` tables now have:

```sql
repetition_count INTEGER DEFAULT 0
easiness_factor DECIMAL(3,2) DEFAULT 2.5
interval_days INTEGER DEFAULT 0
next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
last_reviewed_at TIMESTAMP WITH TIME ZONE
```

### New Table: review_history

Tracks all review sessions:

```sql
id UUID PRIMARY KEY
user_id UUID (references auth.users)
item_type TEXT ('flashcard' or 'question')
item_id UUID
quality INTEGER (0-5 rating)
reviewed_at TIMESTAMP
```

## Best Practices

1. **Daily Practice**: Review due cards daily for best results
2. **Honest Rating**: Rate your performance honestly
3. **Consistency**: Regular practice is more effective than cramming
4. **Start Small**: Begin with 10-20 cards and gradually increase

## Components Included

### 1. PracticeFlashcards (`components/practice-flashcards.tsx`)
- Interactive flashcard practice sessions
- Shows front/back of cards
- Four difficulty ratings
- Progress tracking
- Session completion screen

### 2. PracticeQuestions (`components/practice-questions.tsx`)
- Question and answer practice
- Answer reveal functionality
- Performance rating system
- Progress indicators

### 3. StudyStatsDashboard (`components/study-stats-dashboard.tsx`)
- Overview of all study items
- Due items count
- Study streak tracking
- Mastery progress
- Recent review history
- Separate stats for flashcards and questions

### 4. Complete Practice Page (`app/practice/page.tsx`)
- Tabbed interface for all practice modes
- Study tips and guidance
- Easy navigation between flashcards, questions, and stats

## Future Enhancements

Consider adding:

- [ ] Custom study sessions (cramming mode)
- [ ] Export review history to CSV
- [ ] Charts and graphs for progress visualization
- [ ] Keyboard shortcuts for faster reviews (j/k for navigation, 1-4 for ratings)
- [ ] Audio for flashcards
- [ ] Collaborative study sessions
- [ ] Study goals and reminders
- [ ] Mobile app with push notifications

## Troubleshooting

### Cards not showing up for review

- Check that `next_review_date` is in the past
- Verify the user is authenticated
- Check RLS policies are enabled

### Incorrect intervals

- Ensure quality ratings are between 0-5
- Check that easiness_factor stays between 1.3-2.5
- Verify calculation in `spaced-repetition.ts`

## Resources

- [SM-2 Algorithm Original Paper](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Spaced Repetition Research](https://gwern.net/spaced-repetition)
- [Anki Documentation](https://docs.ankiweb.net/)
