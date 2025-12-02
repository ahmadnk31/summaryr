import type React from "react"
import { FileText, Sparkles } from "lucide-react"

const AiSummaries: React.FC = () => {
  const themeVars = {
    "--sum-primary-color": "hsl(var(--primary))",
    "--sum-background-color": "hsl(var(--background))",
    "--sum-text-color": "hsl(var(--foreground))",
    "--sum-text-dark": "hsl(var(--primary-foreground))",
    "--sum-border-color": "hsl(var(--border))",
    "--sum-border-main": "hsl(var(--foreground) / 0.1)",
    "--sum-highlight-primary": "hsl(var(--primary) / 0.12)",
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
      aria-label="AI-powered summary generation interface"
    >
      {/* Summary Card */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",
          height: "221px",
          background: "var(--sum-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--sum-border-main)",
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
              paddingBottom: "8px",
              borderBottom: "1px solid var(--sum-border-color)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--sum-highlight-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "var(--sum-primary-color)" }} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--sum-text-color)",
                }}
              >
                AI Summary
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "9px",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Brief • Detailed • Bullet Points
              </p>
            </div>
          </div>

          {/* Summary Content */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "10px",
              lineHeight: "16px",
              color: "var(--sum-text-color)",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              • Key concepts extracted from document
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              • Main points summarized intelligently
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              • Multiple summary formats available
            </p>
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>
              Generated in seconds with AI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiSummaries
