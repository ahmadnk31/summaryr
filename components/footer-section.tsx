"use client"

import { Twitter, Github, Linkedin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function FooterSection() {
  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "https://github.com/ahmadnk31/summaryr", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ]

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Use", href: "/terms-of-use" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Support", href: "/support" },
      ],
    },
  ]

  return (
    <footer className="bg-background/50 border-t border-border/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Summaryr Logo" width={28} height={28} />
              <span className="text-xl font-bold text-foreground">Summaryr</span>
            </Link>
            <p className="text-muted-foreground">
              Study smarter, not harder.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border/20 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Summaryr. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
