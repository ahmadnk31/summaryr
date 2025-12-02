import type React from "react"
import { FileText, Upload } from "lucide-react"

const DocumentUpload: React.FC = () => {
  const themeVars = {
    "--doc-primary-color": "hsl(var(--primary))",
    "--doc-background-color": "hsl(var(--background))",
    "--doc-text-color": "hsl(var(--foreground))",
    "--doc-text-dark": "hsl(var(--primary-foreground))",
    "--doc-border-color": "hsl(var(--border))",
    "--doc-border-main": "hsl(var(--foreground) / 0.1)",
    "--doc-highlight-primary": "hsl(var(--primary) / 0.12)",
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
      aria-label="Document upload interface showing file upload with PDF, DOCX, and EPUB support"
    >
      {/* Background Upload Box (Blurred) */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "50%",
          transform: "translateX(-50%) scale(0.9)",
          width: "340px",
          height: "205px",
          background: "linear-gradient(180deg, var(--doc-background-color) 0%, transparent 100%)",
          opacity: 0.6,
          borderRadius: "8.826px",
          border: "0.791px solid var(--doc-border-color)",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          className="border rounded-lg bg-card"
          style={{
            padding: "7.355px 8.826px",
            height: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "9.562px",
              lineHeight: "14.711px",
              color: "hsl(var(--muted-foreground))",
              width: "100%",
              maxWidth: "320px",
              margin: 0,
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>📄 research-paper.pdf</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>📝 lecture-notes.docx</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>📚 textbook.epub</p>
          </div>
        </div>
      </div>

      {/* Foreground Upload Box (Main) */}
      <div
        style={{
          position: "absolute",
          top: "51px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "340px",
          height: "221px",
          background: "var(--doc-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--doc-border-main)",
          overflow: "hidden",
        }}
      >
        <div
          className="bg-card border border-border"
          style={{
            padding: "9.488px",
            height: "100%",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {/* Upload Icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--doc-highlight-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload className="w-6 h-6" style={{ color: "var(--doc-primary-color)" }} />
          </div>

          {/* File Type Icons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "hsl(var(--muted))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <span
              style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "11px",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              PDF • DOCX • EPUB
            </span>
          </div>

          {/* Upload Text */}
          <div
            style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: "10.279px",
              lineHeight: "15.814px",
              color: "var(--doc-text-color)",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>Drag & drop your document</p>
            <p style={{ margin: 0, fontSize: "9px", color: "hsl(var(--muted-foreground))" }}>
              Automatic text extraction
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentUpload
