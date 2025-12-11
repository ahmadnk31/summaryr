# 🎯 Spaced Repetition System - Quick Start

## ✅ What's Been Created

### 📁 Files Created

1. **Database Migration**
   - `scripts/009_add_spaced_repetition.sql` - Adds SR columns and review_history table

2. **Core Library**
   - `lib/spaced-repetition.ts` - SM-2 algorithm implementation

3. **Components**
   - `components/practice-flashcards.tsx` - Flashcard practice UI
   - `components/practice-questions.tsx` - Question practice UI
   - `components/study-stats-dashboard.tsx` - Statistics dashboard

4. **Pages**
   - `app/practice/page.tsx` - Complete practice interface

5. **Documentation**
   - `SPACED_REPETITION.md` - Full documentation

## 🚀 How to Use

### Step 1: Run Database Migration

Go to **Supabase Dashboard** → **SQL Editor**:

```sql
-- Copy and paste the contents of scripts/009_add_spaced_repetition.sql
-- Then click "Run"
```

### Step 2: Add Navigation Link

Add a link to the practice page in your navigation:

```tsx
<Link href="/practice">
  <Button>Practice</Button>
</Link>
```

### Step 3: Start Practicing!

1. Generate some flashcards or questions from a document
2. Visit `/practice` in your app
3. Start reviewing!

## 🎨 Features

✅ **Smart Scheduling** - Items appear when you need to review them
✅ **Performance Tracking** - Tracks how well you know each item
✅ **Study Stats** - Beautiful dashboard with insights
✅ **Streak Tracking** - Motivates daily practice
✅ **Mastery Levels** - See your progress over time
✅ **Review History** - Complete audit trail

## 📊 How It Works

```
First Review → 1 day
Second Review → 6 days
Third+ Review → Previous interval × Easiness Factor

If you get it wrong (rating < 3) → Reset to 1 day
```

## 🎯 Rating Guide

- **Easy (5)** - Knew it instantly
- **Good (4)** - Knew it after thinking
- **Hard (3)** - Barely remembered it
- **Again (0)** - Didn't know it

## 📱 Example Usage

### In Your Dashboard

```tsx
import { PracticeFlashcards } from "@/components/practice-flashcards"
import { StudyStatsDashboard } from "@/components/study-stats-dashboard"

// Show due items count
<StudyStatsDashboard />

// Quick practice session
<PracticeFlashcards />
```

### For a Specific Document

```tsx
<PracticeFlashcards documentId={document.id} />
<PracticeQuestions documentId={document.id} />
```

## 🔧 Customization

### Change Algorithm Parameters

Edit `lib/spaced-repetition.ts`:

```typescript
// Default easiness factor (1.3 - 2.5)
easinessFactor: 2.5

// Interval calculation
if (repetitionCount === 1) {
  intervalDays = 1  // Change first interval
} else if (repetitionCount === 2) {
  intervalDays = 6  // Change second interval
}
```

### Add Custom Quality Presets

```typescript
export const QualityPresets = {
  PERFECT: 5,
  GOOD: 4,
  HARD: 3,
  AGAIN: 0,
  CUSTOM: 2,  // Add your own
} as const
```

## 📈 Next Steps

1. ✅ Run the database migration
2. ✅ Visit `/practice` to try it out
3. ✅ Customize the UI to match your brand
4. ✅ Add links in your navigation/dashboard
5. ✅ Consider adding keyboard shortcuts (future enhancement)
6. ✅ Track user engagement with the feature

## 💡 Tips for Users

- **Practice daily** - Even 5 minutes helps!
- **Be honest** - Accurate ratings = better scheduling
- **Start small** - Begin with 10-20 cards
- **Don't cram** - Spaced repetition works best over time
- **Check stats** - Monitor your progress regularly

## 🐛 Troubleshooting

**No items showing up?**
- Make sure you've generated flashcards/questions
- Check that `next_review_date` is in the past
- Verify the migration ran successfully

**Wrong intervals?**
- Check quality ratings are 0-5
- Ensure easiness_factor stays 1.3-2.5
- Review `calculateNextReview()` logic

**Stats not updating?**
- Clear cache and refresh
- Check review_history table has entries
- Verify user is authenticated

## 📚 Resources

- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Spaced Repetition Research](https://gwern.net/spaced-repetition)
- Full docs: `SPACED_REPETITION.md`

---

**Need help?** Check the full documentation in `SPACED_REPETITION.md`
