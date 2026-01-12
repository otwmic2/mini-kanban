import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BoardSelector from "@/components/board-selector"

export default async function KanbanPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <BoardSelector userId={user.id} userEmail={user.email || ""} />
    </div>
  )
}
