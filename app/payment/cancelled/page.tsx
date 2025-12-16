import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelledPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-red-100 dark:bg-red-900/40 p-3 rounded-full w-fit">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-300">
                        Payment Cancelled
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p className="mb-2">The payment process was cancelled.</p>
                    <p>No charges were made to your account. You can upgrade at any time from the pricing page.</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href="/pricing">Return to Pricing</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
