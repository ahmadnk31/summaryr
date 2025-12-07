"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

export function CTASection() {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section className="w-full py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 hero-gradient" />
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center flex flex-col items-center"
          variants={containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Ready to Revolutionize Your Studying?
          </motion.h2>
          <motion.p
            className="mt-4 max-w-2xl text-lg text-muted-foreground"
            variants={itemVariants}
          >
            Join thousands of students and professionals who are learning smarter, not harder. Get started for free today.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <Link href="/auth/sign-up">
              <Button size="lg">
                Start Your Free Trial
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
