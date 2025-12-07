import { DashboardNavbar } from "@/components/dashboard-navbar"
import { CollaborativePracticeSession } from "@/components/collaborative-practice-session"

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <CollaborativePracticeSession sessionCode={code} />
      </main>
    </div>
  )
}
