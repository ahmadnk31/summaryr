"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface Contact {
    id: string
    created_at: string
    name: string
    email: string
    subject: string
    message: string
    status: string
    replied_at: string | null
}

interface ContactsListProps {
    initialContacts: Contact[]
}

export function ContactsList({ initialContacts }: ContactsListProps) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to real-time changes
        const channel = supabase
            .channel('contacts-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contacts'
                },
                (payload) => {
                    console.log('Realtime change received!', payload)

                    if (payload.eventType === 'INSERT') {
                        const newContact = payload.new as Contact
                        setContacts((prev) => [newContact, ...prev])
                        toast.info("New contact message received!")
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedContact = payload.new as Contact
                        setContacts((prev) =>
                            prev.map((c) => c.id === updatedContact.id ? updatedContact : c)
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setContacts((prev) =>
                            prev.filter((c) => c.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Inbox</h1>
                <Badge variant="outline" className="text-base px-4 py-1">
                    Total: {contacts.length}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Submissions</CardTitle>
                    <CardDescription>Manage user inquiries and support requests (Updates in Realtime).</CardDescription>
                </CardHeader>
                <CardContent>
                    {contacts.length > 0 ? (
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
