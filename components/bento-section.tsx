import DocumentUpload from "./bento/ben1"
import AiSummaries from "./bento/ben2"
import FlashcardGeneration from "./bento/ben3"
import QuestionGeneration from "./bento/ben4"
import DocumentChat from "./bento/ben5"
import ExplanationsAndNotes from "./bento/ben6"

const BentoCard = ({ title, description, Component }) => (
  <div className="overflow-hidden rounded-2xl border border-white/20 flex flex-col justify-start items-start relative">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

    <div className="self-stretch p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-foreground text-lg font-normal leading-7">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-72 relative -mt-0.5 z-10">
      <Component />
    </div>
  </div>
)

export function BentoSection() {
  const cards = [
    {
      title: "Upload any document format.",
      description: "Support for PDF, DOCX, and EPUB with automatic text extraction.",
      Component: DocumentUpload,
    },
    {
      title: "AI-powered summaries",
      description: "Get brief, detailed, or bullet-point summaries in seconds.",
      Component: AiSummaries,
    },
    {
      title: "Generate smart flashcards",
      description: "Create interactive flashcards with multiple types for effective studying.",
      Component: FlashcardGeneration,
    },
    {
      title: "Practice with questions",
      description: "Generate multiple question types and test your understanding.",
      Component: QuestionGeneration,
    },
    {
      title: "Chat with your documents",
      description: "Ask questions and get instant answers based on your document content.",
      Component: DocumentChat,
    },
    {
      title: "Explanations & notes",
      description: "Get AI explanations and save your own notes for better learning.",
      Component: ExplanationsAndNotes,
    },
  ]

  return (
    <section className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
              Study Smarter with AI
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              Transform your documents into interactive study materials with AI-powered summaries, flashcards, questions, and explanations.
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {cards.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
