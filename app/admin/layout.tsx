import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Mail, LayoutDashboard } from "lucide-react"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/sign-in")
    }

    // Check admin status
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

    if (!profile?.is_admin) {
        redirect("/dashboard")
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-muted/40 border-r min-h-screen">
                <div className="p-6 border-b">
                    <Link href="/admin/contacts" className="flex items-center gap-2 font-bold text-xl">
                        Admin Panel
                    </Link>
                </div>
                <nav className="p-4 space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Back to App
                        </Button>
                    </Link>
                    <div className="h-px bg-border my-2" />
                    <Link href="/admin/contacts">
                        <Button variant="secondary" className="w-full justify-start">
                            <Mail className="mr-2 h-4 w-4" />
                            Contacts
                        </Button>
                    </Link>
                    {/* Add more admin links here later */}
                </nav>
            </aside>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}
