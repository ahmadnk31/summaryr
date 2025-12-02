import type React from "react"
import { MessageCircle, Send, Bot } from "lucide-react"

const DocumentChat: React.FC = () => {
  const themeVars = {
    "--chat-primary-color": "hsl(var(--primary))",
    "--chat-background-color": "hsl(var(--background))",
    "--chat-text-color": "hsl(var(--foreground))",
    "--chat-border-color": "hsl(var(--border))",
    "--chat-border-main": "hsl(var(--foreground) / 0.1)",
    "--chat-highlight-primary": "hsl(var(--primary) / 0.12)",
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
      aria-label="Document chat interface for asking questions about documents"
    >
      {/* Chat Container */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",
          height: "240px",
          background: "var(--chat-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--chat-border-main)",
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
              borderBottom: "1px solid var(--chat-border-color)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--chat-highlight-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "var(--chat-primary-color)" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--chat-text-color)",
              }}
            >
              Document Chat
            </p>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {/* User Message */}
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "80%",
                padding: "6px 10px",
                borderRadius: "8px",
                background: "var(--chat-primary-color)",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "10px",
                  lineHeight: "14px",
                }}
              >
                What are the key points?
              </p>
            </div>

            {/* AI Response */}
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "80%",
                padding: "6px 10px",
                borderRadius: "8px",
                background: "hsl(var(--muted))",
                display: "flex",
                gap: "6px",
                alignItems: "flex-start",
              }}
            >
              <Bot className="w-3 h-3" style={{ color: "var(--chat-primary-color)", flexShrink: 0, marginTop: "2px" }} />
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "10px",
                  lineHeight: "14px",
                  color: "var(--chat-text-color)",
                }}
              >
                Based on the document, the key points are...
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              padding: "6px",
              borderRadius: "6px",
              background: "hsl(var(--muted))",
              border: "1px solid var(--chat-border-color)",
            }}
          >
            <input
              type="text"
              placeholder="Ask about the document..."
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "10px",
                color: "var(--chat-text-color)",
                outline: "none",
              }}
            />
            <button
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "var(--chat-primary-color)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentChat
