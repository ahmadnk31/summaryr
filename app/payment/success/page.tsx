import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/40 p-3 rounded-full w-fit">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
                        Payment Successful!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p className="mb-2">Thank you for your purchase.</p>
                    <p>Your subscription is now active and your account has been upgraded.</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                        <Link href="/dashboard/profile">View Subscription</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
