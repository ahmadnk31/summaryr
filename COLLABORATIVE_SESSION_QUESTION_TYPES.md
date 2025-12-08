# Collaborative Practice Session - Question Types Update

## Overview
Updated the collaborative practice session component to support different question formats (MCQ, True/False, Fill-in-blank, Short Answer, Essay) for questions practiced together.

## Changes Made

### 1. Updated Question Interface
**File:** `components/collaborative-practice-session.tsx`

Added `question_type` and `options` fields:

```typescript
interface Question {
  id: string
  question_text: string
  answer_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay' | 'fill_blank'
  options?: string[]
  easiness_factor: number
  interval_days: number
  repetition_count: number
}
```

### 2. Added State Management

New state variables for tracking user responses:
- `selectedOption` - Tracks MCQ/True-False selection
- `userAnswer` - Tracks text input for fill-blank/short-answer/essay

```typescript
const [selectedOption, setSelectedOption] = useState<string | null>(null)
const [userAnswer, setUserAnswer] = useState("")
```

### 3. Updated Rendering Logic

#### Question Display
- Question text always shown at the top
- Different input UI based on question type
- Overflow protection with `break-words` and `overflow-hidden`

#### Multiple Choice Questions
```tsx
<div className="grid grid-cols-1 gap-2">
  {options.map((option, idx) => (
    <Button
      variant={selectedOption === option ? "default" : "outline"}
      className="justify-start text-left h-auto py-3 px-4 whitespace-normal break-words min-h-[44px]"
    >
      <span className="font-semibold mr-2 flex-shrink-0">{A/B/C/D}.</span>
      <span className="flex-1">{option}</span>
    </Button>
  ))}
</div>
```

#### True/False Questions
```tsx
<div className="grid grid-cols-2 gap-2">
  <Button variant={selectedOption === 'True' ? "default" : "outline"}>
    True
  </Button>
  <Button variant={selectedOption === 'False' ? "default" : "outline"}>
    False
  </Button>
</div>
```

#### Fill in the Blank
```tsx
<input
  type="text"
  value={userAnswer}
  onChange={(e) => setUserAnswer(e.target.value)}
  placeholder="Your answer..."
  className="w-full p-3 rounded-lg border"
/>
```

#### Short Answer / Essay
```tsx
<textarea
  value={userAnswer}
  onChange={(e) => setUserAnswer(e.target.value)}
  rows={questionType === 'essay' ? 6 : 3}
  className="w-full p-3 rounded-lg border resize-none"
/>
```

### 4. Answer Display Logic

After clicking "Show Answer":
- Shows the correct answer in a highlighted box
- Shows the user's answer (if they provided one) in a secondary box
- Both answers have overflow protection

```tsx
<div className="p-6 bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
  <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
  <p className="text-lg font-semibold break-words">{correctAnswer}</p>
</div>

{(userAnswer || selectedOption) && (
  <div className="p-6 bg-secondary rounded-lg overflow-hidden">
    <p className="text-sm text-muted-foreground mb-2">Your Answer:</p>
    <p className="text-lg break-words">{userAnswer || selectedOption}</p>
  </div>
)}
```

### 5. Updated Show Answer Button Logic

Button only appears when:
- It's a flashcard (always needs to be flipped)
- OR user has selected/entered an answer for questions

```tsx
{!showAnswer && (isFlashcard || selectedOption || userAnswer) && (
  <Button onClick={handleFlip}>Show Answer</Button>
)}
```

### 6. State Reset on Next Item

When moving to the next question, reset user input:

```typescript
if (currentIndex < items.length - 1) {
  setCurrentIndex(currentIndex + 1)
  setShowAnswer(false)
  setSelectedOption(null)  // NEW
  setUserAnswer("")        // NEW
}
```

## User Experience Flow

### For Flashcards (Unchanged)
1. See front of flashcard
2. Click "Show Answer"
3. See back of flashcard
4. Rate knowledge (Again/Hard/Good/Perfect)

### For Multiple Choice Questions
1. See question text
2. See 4 clickable options (A, B, C, D)
3. Select an option (highlights in blue)
4. Click "Show Answer"
5. See correct answer + your selected answer
6. Rate knowledge

### For True/False Questions
1. See question text
2. See True/False buttons
3. Click your choice
4. Click "Show Answer"
5. See correct answer + your choice
6. Rate knowledge

### For Fill-in-Blank
1. See question text
2. See text input field
3. Type your answer
4. Click "Show Answer"
5. See correct answer + your answer
6. Rate knowledge

### For Short Answer / Essay
1. See question text
2. See textarea (3 or 6 rows)
3. Type your answer
4. Click "Show Answer"
5. See correct answer + your answer
6. Rate knowledge

## Mobile Optimization

- All text uses `break-words` to prevent overflow
- Buttons wrap text with `whitespace-normal`
- Minimum touch target size of 44px
- Responsive padding: `p-4 sm:p-6`
- CardContent has `overflow-x-hidden`

## Backward Compatibility

- Flashcards work exactly as before
- Questions without `question_type` will default to showing text input
- Questions without `options` won't crash (optional chaining used)

## Testing Checklist

- [ ] Create collaborative session with questions
- [ ] Test MCQ questions with long option text
- [ ] Test True/False questions
- [ ] Test fill-in-blank questions
- [ ] Test short answer questions
- [ ] Test essay questions
- [ ] Verify text wraps properly on mobile
- [ ] Verify answer comparison display works
- [ ] Verify state resets when moving to next question
- [ ] Test with flashcards (should work unchanged)

## Benefits

1. **Consistent Experience**: Same question types work in solo and collaborative practice
2. **Better Engagement**: Interactive buttons vs plain text input
3. **Visual Feedback**: Clear indication of selected answers
4. **Answer Comparison**: Users can see both their answer and the correct one
5. **Mobile Friendly**: Proper text wrapping prevents horizontal scroll

## Notes

- The spaced repetition algorithm works the same for all question types
- Scoring (100/75/50/0 points) is based on quality rating, not answer correctness
- Participants can see each other's scores but not their individual answers
- Host can still end the session at any time

## Summary

The collaborative practice session now fully supports all 5 question types with proper rendering, overflow protection, and user input tracking. The experience is consistent across solo practice, document page, and collaborative sessions. 🎉
