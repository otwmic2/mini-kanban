import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-balance">Mini Tablica Kanban</h1>
        <p className="text-xl text-muted-foreground mb-8 text-balance">
          Organizuj swoje zadania z poziomami priorytetów i bądź produktywny
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Zaloguj się</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/sign-up">Zarejestruj się</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
