"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface Project {
  id: string
  name: string
  tasks: Task[]
  totalTime: number
}

interface Task {
  id: string
  name: string
  project_id: string
  completed: boolean
  totalTime: number
}

interface ProjectsListProps {
  initialProjects: Project[]
}

export default function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [newProjectName, setNewProjectName] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error refreshing projects:", error)
    }
  }, [])

  useEffect(() => {
    // Subscribe to changes in projects and tasks
    const projectsChannel = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        refreshProjects
      )
      .subscribe()

    const tasksChannel = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        refreshProjects
      )
      .subscribe()

    const timeEntriesChannel = supabase
      .channel("time_entries_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries" },
        refreshProjects
      )
      .subscribe()

    return () => {
      supabase.removeChannel(projectsChannel)
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(timeEntriesChannel)
    }
  }, [refreshProjects])

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: newProjectName,
        })
        .select()
        .single()

      if (error) throw error

      setProjects([...projects, { ...project, tasks: [], totalTime: 0 }])
      setNewProjectName("")
    } catch (error) {
      console.error("Error creating project:", error)
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskName.trim() || !selectedProject) return

    try {
      const { data: task, error } = await supabase
        .from("tasks1")
        .insert({
          name: newTaskName,
          project_id: selectedProject.id,
          completed: false,
        })
        .select()
        .single()

      if (error) throw error

      setProjects(
        projects.map((p) =>
          p.id === selectedProject.id ? { ...p, tasks: [...p.tasks, task] } : p
        )
      )
      setNewTaskName("")
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  async function handleToggleTask(
    taskId: string,
    projectId: string,
    completed: boolean
  ) {
    try {
      const { error } = await supabase
        .from("tasks1")
        .update({ completed: !completed })
        .eq("id", taskId)

      if (error) throw error

      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, completed: !completed } : t
                ),
              }
            : p
        )
      )
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  function formatDuration(ms: number) {
    if (!ms || isNaN(ms)) return "0s (0h)"

    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 1000 / 60) % 60)
    const hours = Math.floor(ms / 1000 / 60 / 60)
    const decimalHours = (ms / (1000 * 60 * 60)).toFixed(2)

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return `${parts.join(" ") || "0s"} (${decimalHours}h)`
  }

  return (
    <>
      <div className="bg-[#2b2d31] p-6 rounded-lg shadow-lg border border-[#1e1f22]">
        <h2 className="text-xl font-bold mb-4 text-white">
          Create New Project
        </h2>
        <form onSubmit={handleCreateProject} className="flex gap-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
            className="flex-1 p-2 rounded bg-[#383a40] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] outline-none"
          />
          <button
            type="submit"
            className="bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition-colors"
          >
            Create Project
          </button>
        </form>
      </div>

      <div className="bg-[#2b2d31] p-6 rounded-lg shadow-lg border border-[#1e1f22]">
        <h2 className="text-xl font-bold mb-4 text-white">Projects</h2>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-[#1e1f22] rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {project.name}
                  </h3>
                  <div className="text-sm text-gray-400">
                    Total time: {formatDuration(project.totalTime)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="text-sm text-[#5865f2] hover:underline"
                >
                  Add Task
                </button>
              </div>
              {selectedProject?.id === project.id && (
                <form onSubmit={handleCreateTask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                    className="flex-1 p-2 rounded bg-[#383a40] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition-colors"
                  >
                    Add
                  </button>
                </form>
              )}
              <div className="space-y-2">
                {project.tasks?.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() =>
                        handleToggleTask(task.id, project.id, task.completed)
                      }
                      className="rounded border-gray-400"
                    />
                    <div className="flex-1">
                      <span className={task.completed ? "line-through" : ""}>
                        {task.name}
                      </span>
                      <div className="text-sm text-gray-500">
                        Time spent: {formatDuration(task.totalTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
