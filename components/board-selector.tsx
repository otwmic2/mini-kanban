"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, LogOut, Trash2, LayoutGrid } from "lucide-react"
import { useRouter } from "next/navigation"

type Board = {
  id: string
  title: string
  description: string | null
  user_id: string
  created_at: string
}

export default function BoardSelector({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [boards, setBoards] = useState<Board[]>([])
  const [isAddingBoard, setIsAddingBoard] = useState(false)
  const [newBoard, setNewBoard] = useState({
    title: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBoards()
  }, [])

  async function loadBoards() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading boards:", error)
    } else {
      setBoards(data || [])
    }
    setIsLoading(false)
  }

  async function handleAddBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!newBoard.title.trim()) return

    const { error } = await supabase.from("boards").insert({
      title: newBoard.title,
      description: newBoard.description || null,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding board:", error)
    } else {
      setNewBoard({ title: "", description: "" })
      setIsAddingBoard(false)
      loadBoards()
    }
  }

  async function handleDeleteBoard(boardId: string) {
    const { error } = await supabase.from("boards").delete().eq("id", boardId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting board:", error)
    } else {
      loadBoards()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  function openBoard(boardId: string) {
    router.push(`/kanban/${boardId}`)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Moje Tablice Kanban</h1>
            <p className="text-muted-foreground mt-1">{userEmail}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj się
          </Button>
        </div>

        {/* Add Board Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm">
              {boards.length} {boards.length === 1 ? "tablica" : "tablic"}
            </span>
          </div>
          <Button onClick={() => setIsAddingBoard(!isAddingBoard)}>
            <Plus className="mr-2 h-4 w-4" />
            Nowa Tablica
          </Button>
        </div>
      </div>

      {/* Add Board Form */}
      {isAddingBoard && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Utwórz Nową Tablicę</CardTitle>
            <CardDescription>Dodaj nową tablicę do organizacji swoich zadań</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBoard}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Nazwa tablicy</Label>
                  <Input
                    id="title"
                    placeholder="np. Projekt strony internetowej"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Opis (opcjonalnie)</Label>
                  <Textarea
                    id="description"
                    placeholder="Krótki opis tablicy"
                    value={newBoard.description}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddingBoard(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit">Utwórz Tablicę</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Boards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Ładowanie tablic...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            Nie masz jeszcze żadnych tablic. Utwórz swoją pierwszą tablicę, aby zacząć!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => openBoard(board.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight text-balance">{board.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBoard(board.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {board.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground text-pretty">{board.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
