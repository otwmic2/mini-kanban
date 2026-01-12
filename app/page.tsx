import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-balance">Mini Kanban Board</h1>
        <p className="text-xl text-muted-foreground mb-8 text-balance">
          Organize your tasks with priority levels and stay productive
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
