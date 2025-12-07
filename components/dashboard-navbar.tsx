"use client"

import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft, Upload, LogOut, GraduationCap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

interface DashboardNavbarProps {
  showBackButton?: boolean
  backHref?: string
  title?: string
  rightAction?: React.ReactNode
  userName?: string
}

export function DashboardNavbar({
  showBackButton = false,
  backHref = "/dashboard",
  title,
  rightAction,
  userName,
}: DashboardNavbarProps) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard"
  const isDocuments = pathname === "/documents"

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            {showBackButton && (
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Go back</span>
                </Link>
              </Button>
            )}
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity min-w-0 flex-1 sm:flex-initial"
            >
            <Image 
              src="/logo.png" 
              alt="Summaryr Logo" 
              width={28} 
              height={28} 
              className="h-5 w-5 sm:h-7 sm:w-7 flex-shrink-0" 
              priority
              sizes="28px"
            />
              <h1 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                {title || "Summaryr"}
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {rightAction || (
              <>
                <Link href="/practice">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Practice
                  </Button>
                  <Button variant="ghost" size="icon" className="sm:hidden">
                    <GraduationCap className="h-4 w-4" />
                    <span className="sr-only">Practice</span>
                  </Button>
                </Link>
                {!isDocuments && (
                  <Link href="/documents">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                    <Button variant="ghost" size="icon" className="sm:hidden">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Documents</span>
                    </Button>
                  </Link>
                )}
                {isDocuments && (
                  <>
                    <Button asChild size="sm" className="hidden sm:flex">
                      <Link href="/dashboard">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Link>
                    </Button>
                    <Button asChild size="icon" className="sm:hidden">
                      <Link href="/dashboard">
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Upload Document</span>
                      </Link>
                    </Button>
                  </>
                )}
                <form action="/auth/signout" method="post" className="flex-shrink-0">
                  <Button variant="ghost" type="submit" size="sm" className="px-2 sm:px-3">
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sr-only sm:not-sr-only sm:hidden">Sign Out</span>
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

