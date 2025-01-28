import TimeEntries from "@/components/TimeEntries"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface TimeEntry {
  id: number
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

async function getTimeEntriesServer() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: entries, error } = await supabase
    .from("time_entries")
    .select(
      `
      *,
      projects (
        name
      ),
      tasks1 (
        name
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) throw error

  return entries.map((entry) => ({
    id: entry.id,
    projectName: entry.tasks1?.name
      ? `${entry.projects?.name} - ${entry.tasks1.name}`
      : entry.projects?.name || "Unknown Project",
    startTime: new Date(entry.start_time).getTime(),
    endTime: new Date(entry.end_time).getTime(),
    duration:
      new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime(),
    description: entry.description || undefined,
  }))
}

async function getProjectsWithTasksServer() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // First get all projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("name")

  if (projectsError) throw projectsError

  // Then get all tasks for these projects
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks1")
    .select("*")
    .order("name")

  if (tasksError) throw tasksError

  // Combine projects with their tasks
  return projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.project_id === project.id) || [],
  }))
}

export default async function Home() {
  const [initialEntries, initialProjects] = await Promise.all([
    getTimeEntriesServer(),
    getProjectsWithTasksServer(),
  ])

  return (
    <main className="min-h-screen bg-[#313338]">
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-white">Time Tracker</h1>
        <TimeEntries
          initialEntries={initialEntries}
          initialProjects={initialProjects}
        />
      </div>
    </main>
  )
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  return end - start
}
