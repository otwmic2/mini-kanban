"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Trash2, Filter } from "lucide-react"
import { useRouter } from "next/navigation"

type Priority = "low" | "medium" | "high"

type Task = {
  id: string
  list_id: string
  title: string
  description: string | null
  priority: Priority
  position: number
  created_at: string
}

type List = {
  id: string
  board_id: string
  title: string
  position: number
  created_at: string
  tasks: Task[]
}

type Board = {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
}

export default function KanbanBoard({ board, userId }: { board: Board; userId: string }) {
  const [lists, setLists] = useState<List[]>([])
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [addingTaskToList, setAddingTaskToList] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadListsAndTasks()
  }, [])

  async function loadListsAndTasks() {
    setIsLoading(true)

    // Load lists
    const { data: listsData, error: listsError } = await supabase
      .from("lists")
      .select("*")
      .eq("board_id", board.id)
      .order("position", { ascending: true })

    if (listsError) {
      console.error("Error loading lists:", listsError)
      setIsLoading(false)
      return
    }

    // Load tasks for all lists
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .in(
        "list_id",
        listsData.map((l) => l.id),
      )
      .order("position", { ascending: true })

    if (tasksError) {
      console.error("Error loading tasks:", tasksError)
    }

    // Combine lists with their tasks
    const listsWithTasks = listsData.map((list) => ({
      ...list,
      tasks: tasksData?.filter((task) => task.list_id === list.id) || [],
    }))

    setLists(listsWithTasks)
    setIsLoading(false)
  }

  async function handleAddList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListTitle.trim()) return

    const { error } = await supabase.from("lists").insert({
      title: newListTitle,
      board_id: board.id,
      position: lists.length,
    })

    if (error) {
      console.error("Error adding list:", error)
    } else {
      setNewListTitle("")
      setIsAddingList(false)
      loadListsAndTasks()
    }
  }

  async function handleDeleteList(listId: string) {
    const { error } = await supabase.from("lists").delete().eq("id", listId)

    if (error) {
      console.error("Error deleting list:", error)
    } else {
      loadListsAndTasks()
    }
  }

  async function handleAddTask(e: React.FormEvent, listId: string) {
    e.preventDefault()
    if (!newTask.title.trim()) return

    const list = lists.find((l) => l.id === listId)
    if (!list) return

    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      list_id: listId,
      position: list.tasks.length,
    })

    if (error) {
      console.error("Error adding task:", error)
    } else {
      setNewTask({ title: "", description: "", priority: "medium" })
      setAddingTaskToList(null)
      loadListsAndTasks()
    }
  }

  async function handleDeleteTask(taskId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) {
      console.error("Error deleting task:", error)
    } else {
      loadListsAndTasks()
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-amber-500 hover:bg-amber-600"
      case "low":
        return "bg-emerald-500 hover:bg-emerald-600"
    }
  }

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
    }
  }

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "Wysoki"
      case "medium":
        return "Średni"
      case "low":
        return "Niski"
    }
  }

  const filterTasks = (tasks: Task[]) => {
    if (filterPriority === "all") return tasks
    return tasks.filter((task) => task.priority === filterPriority)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/kanban")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{board.title}</h1>
              {board.description && <p className="text-muted-foreground mt-1">{board.description}</p>}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtruj według priorytetu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie priorytety</SelectItem>
              <SelectItem value="high">Wysoki priorytet</SelectItem>
              <SelectItem value="medium">Średni priorytet</SelectItem>
              <SelectItem value="low">Niski priorytet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Ładowanie tablicy...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Existing Lists */}
          {lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{list.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteList(list.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filterTasks(list.tasks).length} {filterTasks(list.tasks).length === 1 ? "zadanie" : "zadań"}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {/* Tasks */}
                  {filterTasks(list.tasks).map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight text-balance">{task.title}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          className={`${getPriorityColor(task.priority)} w-fit text-xs`}
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </CardHeader>
                      {task.description && (
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground text-pretty">{task.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}

                  {/* Add Task Form */}
                  {addingTaskToList === list.id ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <form onSubmit={(e) => handleAddTask(e, list.id)}>
                          <div className="flex flex-col gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor={`task-title-${list.id}`} className="text-xs">
                                Tytuł zadania
                              </Label>
                              <Input
                                id={`task-title-${list.id}`}
                                placeholder="Nazwa zadania"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                required
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`task-desc-${list.id}`} className="text-xs">
                                Opis (opcjonalnie)
                              </Label>
                              <Textarea
                                id={`task-desc-${list.id}`}
                                placeholder="Opis zadania"
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`task-priority-${list.id}`} className="text-xs">
                                Priorytet
                              </Label>
                              <Select
                                value={newTask.priority}
                                onValueChange={(value) => setNewTask({ ...newTask, priority: value as Priority })}
                              >
                                <SelectTrigger id={`task-priority-${list.id}`} className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Niski</SelectItem>
                                  <SelectItem value="medium">Średni</SelectItem>
                                  <SelectItem value="high">Wysoki</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAddingTaskToList(null)}
                              >
                                Anuluj
                              </Button>
                              <Button type="submit" size="sm">
                                Dodaj
                              </Button>
                            </div>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => setAddingTaskToList(list.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj zadanie
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Add New List */}
          <div className="flex-shrink-0 w-80">
            {isAddingList ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nowa Lista</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddList}>
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="list-title">Nazwa listy</Label>
                        <Input
                          id="list-title"
                          placeholder="np. Do zrobienia"
                          value={newListTitle}
                          onChange={(e) => setNewListTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsAddingList(false)}>
                          Anuluj
                        </Button>
                        <Button type="submit">Dodaj Listę</Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full h-full min-h-[120px] bg-transparent"
                onClick={() => setIsAddingList(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj listę
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
