import type React from "react"
import { FileQuestion, CheckCircle, XCircle } from "lucide-react"

const QuestionGeneration: React.FC = () => {
  const themeVars = {
    "--q-primary-color": "hsl(var(--primary))",
    "--q-background-color": "hsl(var(--background))",
    "--q-text-color": "hsl(var(--foreground))",
    "--q-border-color": "hsl(var(--border))",
    "--q-border-main": "hsl(var(--foreground) / 0.1)",
    "--q-highlight-primary": "hsl(var(--primary) / 0.12)",
    "--q-success-color": "hsl(142, 76%, 36%)",
    "--q-error-color": "hsl(0, 84%, 60%)",
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
      aria-label="Question generation and practice quiz interface"
    >
      {/* Question Card */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",
          height: "240px",
          background: "var(--q-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--q-border-main)",
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
            gap: "12px",
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
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--q-highlight-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileQuestion className="w-4 h-4" style={{ color: "var(--q-primary-color)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--q-text-color)",
                }}
              >
                Practice Quiz
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "9px",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Question 1 of 5
              </p>
            </div>
          </div>

          {/* Question */}
          <div
            style={{
              flex: 1,
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "11px",
              lineHeight: "16px",
              color: "var(--q-text-color)",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontWeight: 500 }}>
              What is the main function of mitochondria?
            </p>
            <div
              style={{
                padding: "8px",
                borderRadius: "6px",
                background: "hsl(var(--muted))",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Your answer: Energy production
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              background: "hsl(142, 76%, 36%, 0.1)",
              border: "1px solid hsl(142, 76%, 36%, 0.3)",
            }}
          >
            <CheckCircle className="w-4 h-4" style={{ color: "var(--q-success-color)" }} />
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "10px",
                color: "var(--q-success-color)",
                fontWeight: 500,
              }}
            >
              Correct!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionGeneration
