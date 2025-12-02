import { openai } from "@ai-sdk/openai"
import { generateText, streamObject } from "ai"
import { z } from "zod"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Allow streaming responses up to 30 seconds
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

    const { text, documentId } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Detect language from the first 500 characters
    const { text: languageCode } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., "en", "es", "fr", "de", "zh", "ja", "ko", "ar", "hi", "pt", "ru", "it", "nl", "pl", "tr", "vi", "th", "id", "cs", "sv", "da", "fi", "no", "he", "uk", "ro", "hu", "el", "bg", "hr", "sk", "sl", "et", "lv", "lt", "mt", "ga", "cy", "is", "mk", "sq", "sr", "bs", "me"). If uncertain, default to "en".\n\nText: ${text.substring(0, 500)}\n\nLanguage code:`,
    })

    const detectedLanguage = languageCode.trim().toLowerCase().split(/[\s\n]/)[0] || "en"

    // Map language codes to language names for the prompt
    const languageNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",
      pt: "Portuguese",
      ru: "Russian",
      it: "Italian",
      nl: "Dutch",
      pl: "Polish",
      tr: "Turkish",
      vi: "Vietnamese",
      th: "Thai",
      id: "Indonesian",
      cs: "Czech",
      sv: "Swedish",
      da: "Danish",
      fi: "Finnish",
      no: "Norwegian",
      he: "Hebrew",
      uk: "Ukrainian",
      ro: "Romanian",
      hu: "Hungarian",
      el: "Greek",
      bg: "Bulgarian",
      hr: "Croatian",
      sk: "Slovak",
      sl: "Slovenian",
      et: "Estonian",
      lv: "Latvian",
      lt: "Lithuanian",
      mt: "Maltese",
      ga: "Irish",
      cy: "Welsh",
      is: "Icelandic",
      mk: "Macedonian",
      sq: "Albanian",
      sr: "Serbian",
      bs: "Bosnian",
      me: "Montenegrin",
    }

    const languageName = languageNames[detectedLanguage] || "English"

    // Stream flashcard using AI in the detected language
    const result = streamObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        front: z.string().describe("The front of the flashcard (question or prompt)"),
        back: z.string().describe("The back of the flashcard (answer or explanation)"),
      }),
      prompt: `Create a flashcard in ${languageName} from the following text. The front should be a clear question or prompt, and the back should be the answer or explanation.

Text: ${text}`,
      onFinish: async ({ object }) => {
        // Save to database after streaming completes
        if (!object) return
        try {
          const { error } = await supabase.from("flashcards").insert({
            user_id: user.id,
            document_id: documentId,
            front_text: object.front,
            back_text: object.back,
            source_text: text,
          })
          if (error) console.error("Error saving flashcard:", error)
        } catch (err) {
          console.error("Error saving flashcard:", err)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error generating flashcard:", error)
    return NextResponse.json({ error: "Failed to generate flashcard" }, { status: 500 })
  }
}
