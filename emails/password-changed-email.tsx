
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

export const PasswordChangedEmail = () => {
    const previewText = "Your Summaryr password has been changed"

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                Password Changed Successfully
                            </Heading>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Hello,
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                This is a confirmation that the password for your Summaryr account has been successfully changed.
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                If you did not make this change, please contact our support team immediately to secure your account.
                            </Text>
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Button
                                    className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                    href="https://summaryr.com/contact"
                                >
                                    Contact Support
                                </Button>
                            </Section>
                            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                Your account security is very important to us.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default PasswordChangedEmail
