"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes, ReactNode } from "react"

interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  delay?: number
}

export function AnimatedSection({ children, className, delay = 0, ...props }: AnimatedSectionProps) {
  // Filter out React native event handlers that conflict with Framer Motion
  const motionProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith('on') || key === 'onViewportEnter' || key === 'onViewportLeave')
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
