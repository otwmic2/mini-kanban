"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, LogOut, Filter, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

type Priority = "low" | "medium" | "high"

type Task = {
  id: string
  title: string
  description: string | null
  priority: Priority
  user_id: string
  created_at: string
}

export default function KanbanBoard({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isAddingTask, setIsAddingTask] = useState(false)
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
    loadTasks()
  }, [])

  useEffect(() => {
    if (filterPriority === "all") {
      setFilteredTasks(tasks)
    } else {
      setFilteredTasks(tasks.filter((task) => task.priority === filterPriority))
    }
  }, [filterPriority, tasks])

  async function loadTasks() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading tasks:", error)
    } else {
      setTasks(data || [])
    }
    setIsLoading(false)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.title.trim()) return

    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding task:", error)
    } else {
      setNewTask({ title: "", description: "", priority: "medium" })
      setIsAddingTask(false)
      loadTasks()
    }
  }

  async function handleDeleteTask(taskId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting task:", error)
    } else {
      loadTasks()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">My Kanban Board</h1>
            <p className="text-muted-foreground mt-1">{userEmail}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Filter and Add Task */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsAddingTask(!isAddingTask)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Add Task Form */}
      {isAddingTask && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Add a new task to your board</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Task description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Priority })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddingTask(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            {filterPriority === "all"
              ? "No tasks yet. Create your first task to get started!"
              : `No ${filterPriority} priority tasks found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight text-balance">{task.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <Badge variant={getPriorityBadgeVariant(task.priority)} className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
              </CardHeader>
              {task.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground text-pretty">{task.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
