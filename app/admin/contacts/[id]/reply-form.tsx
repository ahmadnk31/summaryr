"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { replyToContact } from "@/app/actions/admin-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ReplyForm({ contactId }: { contactId: string }) {
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const router = useRouter()

    const handleSend = async () => {
        if (!message.trim()) return
        setSending(true)

        const result = await replyToContact(contactId, message)

        if (result.success) {
            toast.success("Reply sent successfully")
            setMessage("")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to send reply")
        }
        setSending(false)
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Send Reply</h3>
            <Textarea
                placeholder="Type your reply here..."
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={handleSend} disabled={sending}>
                {sending ? "Sending..." : "Send Reply"}
            </Button>
        </div>
    )
}
