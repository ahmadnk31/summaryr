/**
 * Spaced Repetition Algorithm (SM-2)
 * Based on the SuperMemo 2 algorithm
 * 
 * Quality ratings:
 * 5 - Perfect response
 * 4 - Correct response after hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect response; correct answer seemed easy to recall
 * 1 - Incorrect response; correct answer seemed familiar
 * 0 - Complete blackout
 */

export interface SpacedRepetitionData {
  repetitionCount: number
  easinessFactor: number
  intervalDays: number
  nextReviewDate: Date
}

export interface ReviewResult extends SpacedRepetitionData {
  lastReviewedAt: Date
}

/**
 * Calculate the next review schedule based on the SM-2 algorithm
 * @param quality - User's performance rating (0-5)
 * @param currentData - Current spaced repetition data
 * @returns Updated spaced repetition data
 */
export function calculateNextReview(
  quality: number,
  currentData: SpacedRepetitionData
): ReviewResult {
  // Ensure quality is within valid range
  const q = Math.max(0, Math.min(5, quality))
  
  let { repetitionCount, easinessFactor, intervalDays } = currentData
  
  // Calculate new easiness factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easinessFactor = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  )
  
  // If quality < 3, reset the repetition count
  if (q < 3) {
    repetitionCount = 0
    intervalDays = 1
  } else {
    // Increment repetition count
    repetitionCount += 1
    
    // Calculate new interval
    if (repetitionCount === 1) {
      intervalDays = 1
    } else if (repetitionCount === 2) {
      intervalDays = 6
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor)
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays)
  
  return {
    repetitionCount,
    easinessFactor,
    intervalDays,
    nextReviewDate,
    lastReviewedAt: new Date(),
  }
}

/**
 * Get items that are due for review
 * @param items - Array of items with spaced repetition data
 * @returns Items that need to be reviewed
 */
export function getDueItems<T extends { next_review_date: string | Date }>(
  items: T[]
): T[] {
  const now = new Date()
  return items.filter((item) => {
    const reviewDate = new Date(item.next_review_date)
    return reviewDate <= now
  })
}

/**
 * Get study statistics
 */
export interface StudyStats {
  totalItems: number
  dueToday: number
  reviewedToday: number
  averageEasiness: number
  masteredItems: number // Items with repetition_count >= 5
}

export function calculateStudyStats(
  items: Array<{
    repetition_count: number
    easiness_factor: number
    next_review_date: string | Date
    last_reviewed_at?: string | Date | null
  }>
): StudyStats {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const dueToday = items.filter(
    (item) => new Date(item.next_review_date) <= now
  ).length
  
  const reviewedToday = items.filter((item) => {
    if (!item.last_reviewed_at) return false
    const reviewDate = new Date(item.last_reviewed_at)
    return reviewDate >= todayStart
  }).length
  
  const averageEasiness =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.easiness_factor, 0) / items.length
      : 2.5
  
  const masteredItems = items.filter((item) => item.repetition_count >= 5).length
  
  return {
    totalItems: items.length,
    dueToday,
    reviewedToday,
    averageEasiness: Math.round(averageEasiness * 100) / 100,
    masteredItems,
  }
}

/**
 * Quality presets for easier UI implementation
 */
export const QualityPresets = {
  PERFECT: 5,
  GOOD: 4,
  HARD: 3,
  AGAIN: 0,
} as const

export type QualityPreset = typeof QualityPresets[keyof typeof QualityPresets]
