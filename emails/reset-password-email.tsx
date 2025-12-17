
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components"
import * as React from "react"

interface ResetPasswordEmailProps {
    resetLink?: string
}

export const ResetPasswordEmail = ({
    resetLink = "http://localhost:3000/auth/reset-password?token=example",
}: ResetPasswordEmailProps) => {
    const previewText = "Reset your Summaryr password"

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                Reset your <strong>Summaryr</strong> password
                            </Heading>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Hello,
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                We received a request to reset the password for your Summaryr account. If you didn't ask for this, you can verify this email wasn't used by checking your account activity or contacting support.
                            </Text>
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Button
                                    className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                    href={resetLink}
                                >
                                    Reset Password
                                </Button>
                            </Section>
                            <Text className="text-black text-[14px] leading-[24px]">
                                or copy and paste this URL into your browser:{" "}
                                <Link href={resetLink} className="text-blue-600 no-underline">
                                    {resetLink}
                                </Link>
                            </Text>
                            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                If you didn't request a password reset, you can safely ignore this email.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default ResetPasswordEmail
