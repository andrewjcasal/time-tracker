import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import ProjectsList from "@/components/ProjectsList"

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

async function getInitialProjects() {
  const supabase = createServerComponentClient({ cookies })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get all projects for the current user
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  if (!projects) return []

  // Get all tasks for these projects
  const { data: tasks } = await supabase
    .from("tasks1")
    .select("*")
    .in(
      "project_id",
      projects.map((p) => p.id)
    )
    .order("name")

  // Get all time entries for these projects
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*")
    .in(
      "project_id",
      projects.map((p) => p.id)
    )
    .not("end_time", "is", null)

  const projectsWithTime = projects.map((project) => {
    const projectTasks =
      tasks?.filter((task) => task.project_id === project.id) || []
    const projectTimeEntries =
      timeEntries?.filter((entry) => entry.project_id === project.id) || []

    const projectTotalTime = projectTimeEntries.reduce((total, entry) => {
      if (!entry.start_time || !entry.end_time) return total
      const start = new Date(entry.start_time).getTime()
      const end = new Date(entry.end_time).getTime()
      return total + Math.max(0, end - start)
    }, 0)

    return {
      ...project,
      totalTime: projectTotalTime,
      tasks: projectTasks.map((task) => ({
        ...task,
        totalTime: projectTimeEntries.reduce((total, entry) => {
          if (!entry.task_id || !entry.start_time || !entry.end_time)
            return total
          if (entry.task_id !== task.id) return total

          const start = new Date(entry.start_time).getTime()
          const end = new Date(entry.end_time).getTime()
          return total + Math.max(0, end - start)
        }, 0),
      })),
    }
  })

  return projectsWithTime
}

export default async function ProjectsPage() {
  const initialProjects = await getInitialProjects()

  return (
    <div className="space-y-6">
      <ProjectsList initialProjects={initialProjects} />
    </div>
  )
}
