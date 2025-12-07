import { DashboardNavbar } from "@/components/dashboard-navbar"
import { CollaborativePracticeSession } from "@/components/collaborative-practice-session"

export default function PracticeSessionPage({
  params,
}: {
  params: { code: string }
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <CollaborativePracticeSession sessionCode={params.code} />
      </main>
    </div>
  )
}
