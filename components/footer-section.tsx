"use client"

import { Twitter, Github, Linkedin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function FooterSection() {
  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col py-10 md:py-[70px]">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0">
        {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
        <Link href="/" className="flex gap-3 items-center justify-center">
          <Image src="/logo.png" alt="Summaryr Logo" width={24} height={24} className="h-6 w-6" />
          <div className="text-center text-foreground text-xl font-semibold leading-4">Summaryr</div>
        </Link>
        <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">
          Transform documents into study materials
        </p>
        <div className="flex justify-start items-start gap-3">
          <a href="#" aria-label="Twitter" className="w-4 h-4 flex items-center justify-center">
            <Twitter className="w-full h-full text-muted-foreground" />
          </a>
          <a href="https://github.com/ahmadnk31/summaryr" aria-label="GitHub" className="w-4 h-4 flex items-center justify-center">
            <Github className="w-full h-full text-muted-foreground" />
          </a>
          <a href="#" aria-label="LinkedIn" className="w-4 h-4 flex items-center justify-center">
            <Linkedin className="w-full h-full text-muted-foreground" />
          </a>
        </div>
      </div>
      {/* Right Section: Product, Company, Resources */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Product</h3>
          <div className="flex flex-col justify-end items-start gap-2">
            <Link href="#features-section" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Features
            </Link>
            <Link href="#pricing-section" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Pricing
            </Link>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Document Upload
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              AI Summaries
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Flashcards & Questions
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Company</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/about-us" className="text-foreground text-sm font-normal leading-5 hover:underline">
              About us
            </Link>
            <Link href="/contact" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Contact
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Resources</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/terms-of-use" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Terms of use
            </Link>
            <Link href="/privacy-policy" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/support" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Support
            </Link>
          </div>
        </div>
      </div>
      </div>
      <div className="w-full border-t border-border/40 mt-8 pt-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Summaryr. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
