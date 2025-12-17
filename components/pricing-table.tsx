"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const plans = [
    {
        name: "Free",
        description: "For personal use",
        features: [
            "5 Document uploads",
            "Basic text extraction",
            "No web scraping",
            "Community support",
        ],
        monthly: {
            price: "€0",
            priceId: null,
        },
        yearly: {
            price: "€0",
            priceId: null,
        },
        buttonText: "Current Plan",
        disabled: true,
    },
    {
        name: "Pro",
        description: "For professionals",
        features: [
            "Unlimited uploads",
            "Priority processing",
            "Web scraping enabled",
            "Email support",
        ],
        monthly: {
            price: "€10",
            priceId: "price_1Sevb3CwfSQS5OH3kCCl3nu9",
        },
        yearly: {
            price: "€100",
            priceId: "price_YEARLY_PRO_PLACEHOLDER", // REPLACE WITH REAL ID
        },
        buttonText: "Upgrade to Pro",
        disabled: false,
    },
    {
        name: "Team",
        description: "For simplified collaboration",
        features: [
            "Everything in Pro",
            "Real-time collaboration",
            "Team management",
            "Dedicated support",
        ],
        monthly: {
            price: "€15",
            priceId: "price_1SexnNCwfSQS5OH3puCc1rdz",
        },
        yearly: {
            price: "€150",
            priceId: "price_YEARLY_TEAM_PLACEHOLDER", // REPLACE WITH REAL ID
        },
        buttonText: "Upgrade to Team",
        disabled: false,
    },
];

export function PricingTable({ currentPlan = "free", highlightedPlan }: { currentPlan?: string; highlightedPlan?: string }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
    const router = useRouter();

    const handleSubscribe = async (priceId: string, planName: string) => {
        if (!priceId) return;
        setLoading(priceId);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, planName: planName.toLowerCase() }),
            });

            if (!response.ok) {
                throw new Error("Failed to start checkout");
            }

            const data = await response.json();
            if (data.url) {
                router.push(data.url);
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setLoading("portal");
        try {
            const response = await fetch("/api/stripe/portal", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to create portal session");
            }

            const data = await response.json();
            if (data.url) {
                router.push(data.url);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subscription portal.");
        } finally {
            setLoading(null);
        }
    };

    const getButtonAction = (plan: typeof plans[0]) => {
        const isCurrent = currentPlan.toLowerCase() === plan.name.toLowerCase();

        // Define hierarchy for upgrade/downgrade logic if needed
        const tiers = { free: 0, pro: 1, team: 2 };
        // @ts-ignore
        const currentTierLevel = tiers[currentPlan.toLowerCase()] || 0;
        // @ts-ignore
        const planTierLevel = tiers[plan.name.toLowerCase()] || 0;

        const currentPriceId = plan[interval].priceId;

        if (isCurrent) {
            if (plan.name.toLowerCase() === 'free') {
                return { text: "Current Plan", disabled: true, action: undefined };
            }
            return { text: "Manage Subscription", disabled: false, action: handleManageSubscription };
        }

        if (planTierLevel > currentTierLevel) {
            return { text: `Upgrade to ${plan.name}`, disabled: false, action: () => currentPriceId && handleSubscribe(currentPriceId, plan.name) };
        }

        // Downgrade case (or just different plan)
        if (planTierLevel < currentTierLevel) {
            if (plan.name.toLowerCase() === 'free') {
                // Downgrading to free usually done via portal cancel
                return { text: "Downgrade via Portal", disabled: false, action: handleManageSubscription };
            }
            // Downgrading to another paid plan
            return { text: "Manage Subscription", disabled: false, action: handleManageSubscription };
        }

        return { text: "Subscribe", disabled: false, action: () => currentPriceId && handleSubscribe(currentPriceId, plan.name) };
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-center">
                <div className="bg-muted p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => setInterval("monthly")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${interval === "monthly"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setInterval("yearly")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${interval === "yearly"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Yearly <span className="ml-1 text-xs text-primary font-normal">(Save 20%)</span>
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => {
                    const { text, disabled, action } = getButtonAction(plan);
                    const currentPrice = plan[interval].price;
                    const priceId = plan[interval].priceId;
                    const isHighlighted = highlightedPlan?.toLowerCase() === plan.name.toLowerCase();

                    return (
                        <Card key={plan.name} className={`${plan.name === "Pro" || isHighlighted ? "border-primary shadow-lg scale-105" : ""} ${isHighlighted ? "ring-2 ring-offset-2 ring-primary" : "transition-transform duration-200"}`}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold mb-4">
                                    {currentPrice}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        /{interval === "monthly" ? "mo" : "yr"}
                                    </span>
                                </div>
                                <ul className="space-y-2">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="h-4 w-4 mr-2 text-primary" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.name === "Pro" ? "default" : "outline"}
                                    disabled={disabled || !!loading}
                                    onClick={() => action && action()}
                                >
                                    {loading === (action === handleManageSubscription ? "portal" : priceId) ? "Processing..." : text}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
