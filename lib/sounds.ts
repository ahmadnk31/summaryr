/**
 * Sound effects for practice sessions
 * Uses the Web Audio API to generate tones
 */

class SoundManager {
  private audioContext: AudioContext | null = null

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  private playTone(frequency: number, duration: number = 0.15, volume: number = 0.3) {
    try {
      const ctx = this.getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  /**
   * Play success sound (Easy - Perfect recall)
   */
  playPerfect() {
    this.playTone(880, 0.15, 0.3) // A5
    setTimeout(() => this.playTone(1046.5, 0.15, 0.3), 100) // C6
  }

  /**
   * Play good sound (Good - Correct after thought)
   */
  playGood() {
    this.playTone(659.25, 0.15, 0.25) // E5
    setTimeout(() => this.playTone(783.99, 0.15, 0.25), 80) // G5
  }

  /**
   * Play hard sound (Hard - Difficult recall)
   */
  playHard() {
    this.playTone(523.25, 0.2, 0.25) // C5
  }

  /**
   * Play again sound (Again - Incorrect)
   */
  playAgain() {
    this.playTone(261.63, 0.1, 0.2) // C4
    setTimeout(() => this.playTone(246.94, 0.15, 0.2), 80) // B3
  }

  /**
   * Play flip sound (when revealing answer)
   */
  playFlip() {
    this.playTone(440, 0.08, 0.15) // A4
  }

  /**
   * Play complete sound (session finished)
   */
  playComplete() {
    this.playTone(523.25, 0.1, 0.3) // C5
    setTimeout(() => this.playTone(659.25, 0.1, 0.3), 100) // E5
    setTimeout(() => this.playTone(783.99, 0.1, 0.3), 200) // G5
    setTimeout(() => this.playTone(1046.5, 0.2, 0.3), 300) // C6
  }
}

// Singleton instance
let soundManager: SoundManager | null = null

export function getSoundManager(): SoundManager {
  if (typeof window === 'undefined') {
    // Return a mock on server side
    return {
      playPerfect: () => {},
      playGood: () => {},
      playHard: () => {},
      playAgain: () => {},
      playFlip: () => {},
      playComplete: () => {},
    } as SoundManager
  }

  if (!soundManager) {
    soundManager = new SoundManager()
  }
  return soundManager
}

// Hook for easy usage in components
export function useSounds() {
  return getSoundManager()
}
