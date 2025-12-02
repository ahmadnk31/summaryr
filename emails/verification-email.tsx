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

interface VerificationEmailProps {
  name: string
  verificationUrl: string
}

export function VerificationEmail({ name, verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify Your Email</Heading>
          <Section style={section}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Thank you for signing up for Summaryr! Please verify your email address by clicking the button below.
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Link href={verificationUrl} style={button}>
              Verify Email Address
            </Link>
          </Section>
          <Section style={section}>
            <Text style={smallText}>
              Or copy and paste this link into your browser:
            </Text>
            <Link href={verificationUrl} style={linkText}>
              {verificationUrl}
            </Link>
            <Text style={smallText}>
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
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

const linkText = {
  color: "#0070f3",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0",
  wordBreak: "break-all" as const,
  textDecoration: "underline",
  display: "block",
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

