import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from "@react-email/components"

interface WelcomeEmailProps {
  name: string
  dashboardUrl: string
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Summaryr!</Heading>
          <Section style={section}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Thank you for verifying your email address. Your account is now active and ready to use!
            </Text>
            <Text style={text}>
              Get started by uploading your first document and transforming it into study materials with AI.
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Go to Dashboard
            </Link>
          </Section>
          <Section style={section}>
            <Text style={text}>Here's what you can do with Summaryr:</Text>
            <ul style={list}>
              <li style={listItem}>📄 Upload PDF, DOCX, or EPUB documents</li>
              <li style={listItem}>📝 Generate AI-powered summaries</li>
              <li style={listItem}>🎴 Create interactive flashcards</li>
              <li style={listItem}>❓ Generate practice questions</li>
              <li style={listItem}>💬 Chat with your documents</li>
              <li style={listItem}>💡 Get explanations for complex concepts</li>
            </ul>
          </Section>
          <Section style={section}>
            <Text style={smallText}>
              If you have any questions, feel free to reach out to our support team. We're here to help!
            </Text>
            <Text style={smallText}>
              Happy studying!<br />
              The Summaryr Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  backgroundColor: "#f6f9fc",
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
}

const section = {
  padding: "0 48px",
  marginBottom: "20px",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
}

const smallText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0 0 0",
}

const buttonSection = {
  padding: "0 48px",
  marginBottom: "20px",
  textAlign: "center" as const,
}

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const list = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  paddingLeft: "20px",
}

const listItem = {
  margin: "8px 0",
}

