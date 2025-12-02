import type React from "react"
import { Lightbulb, StickyNote } from "lucide-react"

const ExplanationsAndNotes: React.FC = () => {
  const themeVars = {
    "--exp-primary-color": "hsl(var(--primary))",
    "--exp-background-color": "hsl(var(--background))",
    "--exp-text-color": "hsl(var(--foreground))",
    "--exp-border-color": "hsl(var(--border))",
    "--exp-border-main": "hsl(var(--foreground) / 0.1)",
    "--exp-highlight-primary": "hsl(var(--primary) / 0.12)",
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
      aria-label="Explanations and notes interface"
    >
      {/* Explanation Card */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "180px",
          background: "var(--exp-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--exp-border-main)",
          overflow: "hidden",
        }}
      >
        <div
          className="bg-card border border-border"
          style={{
            padding: "12px",
            height: "100%",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "var(--exp-highlight-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lightbulb className="w-4 h-4" style={{ color: "var(--exp-primary-color)" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--exp-text-color)",
              }}
            >
              AI Explanation
            </p>
          </div>

          {/* Explanation Content */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "9px",
              lineHeight: "14px",
              color: "var(--exp-text-color)",
            }}
          >
            <p style={{ margin: "0 0 6px 0" }}>
              This concept explains how complex systems work by breaking them down into simpler components...
            </p>
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: "8px" }}>
              Generated with AI understanding
            </p>
          </div>
        </div>
      </div>

      {/* Notes Card */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "300px",
          height: "120px",
          background: "var(--exp-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--exp-border-main)",
          overflow: "hidden",
        }}
      >
        <div
          className="bg-card border border-border"
          style={{
            padding: "10px",
            height: "100%",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <StickyNote className="w-4 h-4" style={{ color: "var(--exp-primary-color)" }} />
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--exp-text-color)",
              }}
            >
              My Notes
            </p>
          </div>

          {/* Note Content */}
          <div
            style={{
              flex: 1,
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "8px",
              lineHeight: "12px",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <p style={{ margin: 0 }}>• Important point to remember</p>
            <p style={{ margin: 0 }}>• Need to review this section</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExplanationsAndNotes
