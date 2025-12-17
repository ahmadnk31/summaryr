"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  const pricingPlans = [
    {
      name: "Free",
      price: { monthly: 0, annually: 0 },
      description: "Perfect for getting started.",
      features: [
        "Upload up to 5 documents",
        "Basic text extraction",
        "No web scraping",
        "Community support",
      ],
      cta: "Start for Free",
      href: "/auth/sign-up",
    },
    {
      name: "Pro",
      price: { monthly: 10, annually: 8.33 }, // 100 / 12 ~ 8.33
      displayPrice: { monthly: "€10", annually: "€50" }, // explicit display values
      description: "For students and professionals.",
      features: [
        "Unlimited document uploads",
        "Priority processing",
        "Web scraping enabled",
        "Email support",
      ],
      cta: "Upgrade to Pro",
      href: "/pricing?plan=pro",
      popular: true,
    },
    {
      name: "Team",
      price: { monthly: 15, annually: 12.50 }, // 150 / 12 = 12.50
      displayPrice: { monthly: "€15", annually: "€100" },
      description: "For simplified collaboration.",
      features: [
        "Everything in Pro",
        "Real-time collaboration",
        "Team management",
        "Dedicated support",
      ],
      cta: "Upgrade to Team",
      href: "/pricing?plan=team",
    },
  ]

  const PlanCard = ({ plan, isAnnual }: { plan: (typeof pricingPlans)[0], isAnnual: boolean }) => (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: pricingPlans.indexOf(plan) * 0.1 }}
      viewport={{ once: true, amount: 0.5 }}
      className={`relative flex flex-col p-6 rounded-2xl border ${plan.popular ? "bg-card border-primary" : "bg-card/50 border-border/30"}`}
    >
      {plan.popular && (
        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </div>
        </div>
      )}
      <div className="flex-grow">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        <p className="mt-2 text-muted-foreground">{plan.description}</p>
        <div className="mt-6">
          <span className="text-4xl font-bold">
            {isAnnual && plan.displayPrice ? (
              // Show effective monthly cost or total yearly? Usually marketing shows "per month, billed annually"
              // But here let's stick to the convention. 
              // If we want to show "€8.33/mo", we use the calculated value.
              // Let's explicitly show the formatted value if it exists, otherwise fallback
              "€" + plan.price.annually
            ) : (
              "€" + plan.price.monthly
            )}
          </span>
          <span className="text-muted-foreground">/month</span>
          {isAnnual && plan.displayPrice && (
            <div className="text-sm text-muted-foreground mt-1">
              Billed {plan.displayPrice.annually} yearly
            </div>
          )}
        </div>
        <ul className="mt-6 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link href={plan.href} className="mt-8">
        <Button
          size="lg"
          className="w-full"
          variant={plan.popular ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>
    </motion.div>
  )

  return (
    <section id="pricing" className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Pricing for Every Learner
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Choose the plan that's right for you and unlock your full learning potential.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`font-medium ${isAnnual ? 'text-muted-foreground' : 'text-foreground'}`}>Monthly</span>
          <div
            className="relative w-14 h-8 bg-muted rounded-full cursor-pointer p-1"
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <motion.div
              className="w-6 h-6 bg-primary rounded-full"
              layout
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
              style={{
                position: 'absolute',
                left: isAnnual ? 'auto' : '4px',
                right: isAnnual ? '4px' : 'auto',
              }}
            />
          </div>
          <span className={`font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Annually</span>
          <div className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">SAVE UP TO 20%</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </section>
  )
}

