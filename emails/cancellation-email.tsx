import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Link,
    Button,
    Preview,
} from "@react-email/components"

interface CancellationEmailProps {
    name: string
    pricingUrl: string
}

export function CancellationEmail({ name, pricingUrl }: CancellationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>We're sorry to see you go</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Subscription Cancelled</Heading>
                    <Section style={section}>
                        <Text style={text}>Hi {name},</Text>
                        <Text style={text}>
                            This email is to confirm that your Summaryr subscription has been cancelled.
                        </Text>
                        <Text style={text}>
                            We're sorry to see you go! You will continue to have access to Pro features until the end of your current billing period.
                        </Text>
                        <Text style={text}>
                            If you change your mind, you can resubscribe at any time to regain full access to unlimited uploads and AI features.
                        </Text>
                    </Section>
                    <Section style={buttonSection}>
                        <Button href={pricingUrl} style={button}>
                            View Plans
                        </Button>
                    </Section>
                    <Section style={section}>
                        <Text style={smallText}>
                            If this was a mistake or you have feedback on how we can improve, please reply to this email or contact <Link href="mailto:support@summaryr.com" style={link}>support@summaryr.com</Link>. We'd love to hear from you.
                        </Text>
                        <Text style={smallText}>
                            Best,<br />
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
    cursor: "pointer",
}

const link = {
    color: "#0070f3",
    textDecoration: "underline",
}
