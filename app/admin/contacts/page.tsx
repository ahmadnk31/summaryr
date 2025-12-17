import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminContactsPage() {
    const supabase = await createClient()

    // Fetch contacts ordered by newest first
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Inbox</h1>
                <Badge variant="outline" className="text-base px-4 py-1">
                    Total: {contacts?.length || 0}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Submissions</CardTitle>
                    <CardDescription>Manage user inquiries and support requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {contacts && contacts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell>
                                            {contact.status === 'new' ? (
                                                <Badge variant="default">New</Badge>
                                            ) : (
                                                <Badge variant="secondary">Replied</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{contact.subject}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{contact.name}</span>
                                                <span className="text-xs text-muted-foreground">{contact.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/contacts/${contact.id}`}>
                                                <Button size="sm" variant="outline">View</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No messages found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
