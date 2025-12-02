import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components"

interface ContactEmailProps {
  name: string
  email: string
  subject: string
  message: string
}

export function ContactEmail({ name, email, subject, message }: ContactEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Contact Form Submission</Heading>
          <Section style={section}>
            <Text style={label}>Name:</Text>
            <Text style={value}>{name}</Text>
          </Section>
          <Section style={section}>
            <Text style={label}>Email:</Text>
            <Text style={value}>{email}</Text>
          </Section>
          <Section style={section}>
            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject}</Text>
          </Section>
          <Section style={section}>
            <Text style={label}>Message:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
}

const section = {
  padding: "0 48px",
  marginBottom: "20px",
}

const label = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "26px",
  fontWeight: "bold",
  margin: "0",
}

const value = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "26px",
  margin: "0 0 10px 0",
}

const messageText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "10px 0",
  whiteSpace: "pre-wrap",
}

