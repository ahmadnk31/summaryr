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

    const { text, documentId, type = "short_answer" } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const typePrompts: Record<string, string> = {
      short_answer: "Create a short answer question that requires a brief, focused response.",
      multiple_choice: "Create a multiple choice question with 4 options (A, B, C, D) and indicate the correct answer.",
      true_false: "Create a true/false question with a clear statement.",
      essay: "Create an essay question that requires a detailed, comprehensive answer.",
      fill_blank: "Create a fill-in-the-blank question with a sentence or paragraph missing key terms.",
    }

    const typePrompt = typePrompts[type] || typePrompts.short_answer

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

    // Stream question using AI in the detected language
    const result = streamObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        question: z.string().describe("The study question"),
        answer: z.string().describe("The answer to the question"),
        difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level"),
        options: z.array(z.string()).optional().describe("Options for multiple choice questions (if applicable)"),
      }),
      prompt: `Create a study question in ${languageName} from the following text. ${typePrompt} The question should test understanding of the key concepts.${type === "multiple_choice" ? " Include 4 options and make sure the answer is one of them." : ""}

Text: ${text}`,
      onFinish: async ({ object }) => {
        // Save to database after streaming completes
        if (!object) return
        try {
          const { error } = await supabase.from("questions").insert({
            user_id: user.id,
            document_id: documentId,
            question_text: object.question,
            answer_text: object.answer,
            difficulty: object.difficulty,
            question_type: type,
            options: object.options || null,
            source_text: text,
          })
          if (error) console.error("Error saving question:", error)
        } catch (err) {
          console.error("Error saving question:", err)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error generating question:", error)
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 })
  }
}
