import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User, Mail, Calendar, MessageSquare } from "lucide-react"
import { ReplyForm } from "./reply-form"

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", params.id)
        .single()

    if (!contact) {
        notFound()
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/contacts">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Message Details</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{contact.subject}</CardTitle>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(contact.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {contact.status === 'new' ? (
                                    <Badge>New</Badge>
                                ) : (
                                    <Badge variant="secondary">Replied</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="whitespace-pre-wrap leading-relaxed text-sm">
                            {contact.message}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <ReplyForm contactId={contact.id} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sender Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">User</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate" title={contact.email}>{contact.email}</p>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {contact.replied_at && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Replied on {new Date(contact.replied_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

function CheckCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
