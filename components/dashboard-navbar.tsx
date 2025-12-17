"use client"

import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft, Upload, LogOut, GraduationCap, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardNavbarProps {
  showBackButton?: boolean
  backHref?: string
  title?: string
  rightAction?: React.ReactNode
  userName?: string
  planTier?: string
}

export function DashboardNavbar({
  showBackButton = false,
  backHref = "/dashboard",
  title,
  rightAction,
  userName,
  planTier = 'free',
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

                <Button asChild variant="default" size="sm" className="hidden sm:flex bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none">
                  <Link href={planTier === 'free' ? '/pricing?plan=pro' : planTier === 'pro' ? '/pricing?plan=team' : '/dashboard/profile'}>
                    <span className="mr-2">👑</span>
                    {planTier === 'free' ? 'Upgrade to Pro' : planTier === 'pro' ? 'Upgrade to Team' : 'Manage Plan'}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="sm:hidden text-amber-500">
                  <Link href={planTier === 'free' ? '/pricing?plan=pro' : planTier === 'pro' ? '/pricing?plan=team' : '/dashboard/profile'}>
                    <span className="text-lg">👑</span>
                    <span className="sr-only">
                      {planTier === 'free' ? 'Upgrade to Pro' : planTier === 'pro' ? 'Upgrade to Team' : 'Manage Plan'}
                    </span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full border bg-muted" suppressHydrationWarning>
                      <User className="h-4 w-4" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile & Billing</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <form action="/auth/signout" method="post" className="w-full">
                        <button type="submit" className="flex w-full items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

