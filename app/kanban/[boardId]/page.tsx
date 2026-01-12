import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import KanbanBoard from "@/components/kanban-board"

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const supabase = await createClient()
  const { boardId } = await params

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Verify user owns this board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .eq("user_id", user.id)
    .single()

  if (boardError || !board) {
    redirect("/kanban")
  }

  return (
    <div className="min-h-screen bg-background">
      <KanbanBoard board={board} userId={user.id} />
    </div>
  )
}
