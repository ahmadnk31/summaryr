"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, CreditCard, Upload, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface ProfileViewProps {
    user: {
        email?: string
        full_name?: string
    }
    subscription: {
        plan_tier: string
        subscription_status: string
        stripe_customer_id?: string
    }
    usage: {
        documentCount: number
        uploadLimit: number | "Unlimited"
    }
}

export function ProfileView({ user, subscription, usage }: ProfileViewProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleManageSubscription = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/stripe/portal", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error("Failed to create portal session")
            }

            const data = await response.json()
            if (data.url) {
                router.push(data.url)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load subscription portal.")
            setLoading(false)
        }
    }

    const isFree = subscription.plan_tier === "free"
    const planLabel = subscription.plan_tier.charAt(0).toUpperCase() + subscription.plan_tier.slice(1)

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile & Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and subscription.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <div className="text-base font-medium">{user.email}</div>
                        </div>
                        {user.full_name && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                <div className="text-base font-medium">{user.full_name}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Subscription Plan
                        </CardTitle>
                        <CardDescription>
                            You are currently on the <span className="font-semibold text-foreground">{planLabel}</span> plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={subscription.subscription_status === 'active' ? 'default' : 'secondary'}>
                                {subscription.subscription_status}
                            </Badge>
                        </div>

                        {isFree ? (
                            <div className="rounded-md bg-muted p-4 text-sm">
                                <p className="mb-2">Upgrade to Pro to unlock unlimited uploads, web scraping, and more.</p>
                                <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none">
                                    <Link href="/pricing">View Upgrade Options</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md bg-muted p-4 text-sm">
                                <p className="mb-2">Manage your payment method, billing history, and plan details.</p>

                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        {!isFree ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleManageSubscription}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Manage Subscription
                            </Button>
                        ) : (
                            null
                        )}
                    </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Usage Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Document Uploads</span>
                                    <span className="text-muted-foreground">{usage.documentCount} / {usage.uploadLimit}</span>
                                </div>
                                {typeof usage.uploadLimit === 'number' && (
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${Math.min((usage.documentCount / usage.uploadLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                                {usage.uploadLimit === 'Unlimited' && (
                                    <div className="h-2 w-full rounded-full bg-primary/20">
                                        <div className="h-full rounded-full bg-primary w-full" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
