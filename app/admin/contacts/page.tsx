import { createClient } from "@/lib/supabase/server"
import { ContactsList } from "@/components/admin/contacts-list"

export default async function AdminContactsPage() {
    const supabase = await createClient()

    // Fetch contacts ordered by newest first
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })

    return <ContactsList initialContacts={contacts || []} />
}
