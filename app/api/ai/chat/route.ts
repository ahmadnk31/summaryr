import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // useCompletion sends the prompt as 'prompt' in the body
    const message = body.prompt || body.message || ""
    const { documentId, documentText, conversationHistory } = body

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!documentText || typeof documentText !== "string") {
      return NextResponse.json({ error: "Document text is required" }, { status: 400 })
    }

    if (!documentText) {
      return NextResponse.json({ error: "Document text is required" }, { status: 400 })
    }

    // Build conversation context
    const systemPrompt = `You are a helpful AI assistant that answers questions about a document. 
Use the document content provided below to answer the user's questions accurately and concisely.
If the answer cannot be found in the document, say so clearly.
Keep your answers focused and relevant to the document content.

Document Content:
${documentText.substring(0, 8000)}${documentText.length > 8000 ? "\n\n[Document continues...]" : ""}`

    // Build messages array with conversation history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = []

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          })
        }
      })
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    })

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: messages,
      onFinish: async ({ text }) => {
        // Optionally save chat history to database
        if (documentId) {
          try {
            // Check if chat_messages table exists, if not, we'll skip saving
            const { error } = await supabase.from("chat_messages").insert({
              user_id: user.id,
              document_id: documentId,
              user_message: message,
              assistant_message: text,
            })
            if (error) {
              // Table might not exist, that's okay
              console.log("Chat history not saved (table may not exist):", error.message)
            }
          } catch (err) {
            // Ignore errors if table doesn't exist
            console.log("Chat history not saved")
          }
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error generating chat response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

