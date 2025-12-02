import type React from "react"
import { BookOpen, RotateCcw } from "lucide-react"

const FlashcardGeneration: React.FC = () => {
  const themeVars = {
    "--fc-primary-color": "hsl(var(--primary))",
    "--fc-background-color": "hsl(var(--background))",
    "--fc-text-color": "hsl(var(--foreground))",
    "--fc-border-color": "hsl(var(--border))",
    "--fc-border-main": "hsl(var(--foreground) / 0.1)",
    "--fc-highlight-primary": "hsl(var(--primary) / 0.12)",
  }

  return (
    <div
      style={
        {
          width: "100%",
          height: "100%",
          position: "relative",
          background: "transparent",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Flashcard generation and study interface"
    >
      {/* Flashcard */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "300px",
          height: "200px",
          perspective: "1000px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s",
          }}
        >
          {/* Front of Card */}
          <div
            className="bg-card border border-border"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--fc-highlight-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: "var(--fc-primary-color)" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--fc-text-color)",
                textAlign: "center",
              }}
            >
              What is photosynthesis?
            </p>
          </div>

          {/* Back of Card */}
          <div
            className="bg-card border border-border"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "12px",
                color: "var(--fc-text-color)",
                textAlign: "center",
              }}
            >
              The process by which plants convert light energy into chemical energy
            </p>
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <button
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  background: "var(--fc-highlight-primary)",
                  border: "none",
                  color: "var(--fc-primary-color)",
                  fontSize: "10px",
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  cursor: "pointer",
                }}
              >
                I Know This
              </button>
              <button
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "1px solid var(--fc-border-color)",
                  color: "var(--fc-text-color)",
                  fontSize: "10px",
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  cursor: "pointer",
                }}
              >
                Don't Know
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flip Indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "9px",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <RotateCcw className="w-3 h-3" />
        <span>Click to flip</span>
      </div>
    </div>
  )
}

export default FlashcardGeneration
