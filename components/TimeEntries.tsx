"use client"

import { useState, useEffect, useCallback } from "react"
import TimeTracker from "@/components/TimeTracker"
import TimeHistory from "@/components/TimeHistory"
import { supabase, deleteTimeEntry } from "@/lib/supabase"

interface TimeEntry {
  id: string
  projectName: string
  startTime: number
  endTime: number
  duration: number
  description?: string
}

interface Project {
  id: string
  name: string
  tasks: Task[]
}

interface Task {
  id: string
  name: string
  project_id: string
  completed: boolean
}

interface TimeEntriesProps {
  initialEntries: TimeEntry[]
  initialProjects: Project[]
}

export default function TimeEntries({
  initialEntries,
  initialProjects,
}: TimeEntriesProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialEntries)
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const refreshData = useCallback(async () => {
    try {
      // Fetch fresh time entries
      const response = await fetch("/api/time-entries")
      if (!response.ok) throw new Error("Failed to fetch time entries")
      const timeEntriesData = await response.json()
      setTimeEntries(timeEntriesData)

      // Fetch fresh projects data
      const projectsResponse = await fetch("/api/projects")
      if (!projectsResponse.ok) throw new Error("Failed to fetch projects")
      const projectsData = await projectsResponse.json()
      setProjects(projectsData)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }, [])

  const handleDelete = async (id: string) => {
    try {
      // First delete the entry
      await deleteTimeEntry(id)

      // Then optimistically update UI
      setTimeEntries((prev) => prev.filter((entry) => entry.id !== id))

      // Finally refresh all data
      await refreshData()
    } catch (error) {
      console.error("Error handling delete:", error)
      // Revert optimistic update if delete fails
      await refreshData()
    }
  }

  useEffect(() => {
    const timeEntriesChannel = supabase
      .channel("time_entries_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_entries",
        },
        refreshData
      )
      .subscribe()

    const projectsChannel = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        refreshData
      )
      .subscribe()

    const tasksChannel = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks1",
        },
        refreshData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(timeEntriesChannel)
      supabase.removeChannel(projectsChannel)
      supabase.removeChannel(tasksChannel)
    }
  }, [refreshData])

  const addTimeEntry = (entry: TimeEntry) => {
    setTimeEntries((prev) => [entry, ...prev])
  }

  return (
    <>
      <TimeTracker onSaveEntry={addTimeEntry} projects={projects} />
      <TimeHistory
        entries={timeEntries}
        onDelete={handleDelete}
        onUpdate={refreshData}
      />
    </>
  )
}
