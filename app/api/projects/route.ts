import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all projects for the current user
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq('user_id', user.id)
      .order("name")

    if (projectsError) throw projectsError

    // Get all tasks for these projects
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks1")
      .select("*")
      .in('project_id', projects.map(p => p.id))
      .order("name")

    if (tasksError) throw tasksError

    // Get all time entries for these projects
    const { data: timeEntries, error: timeError } = await supabase
      .from("time_entries")
      .select("*")
      .in('project_id', projects.map(p => p.id))
      .not("end_time", "is", null)

    if (timeError) throw timeError

    const projectsWithTime = projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id)
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

    return NextResponse.json(projectsWithTime)
  } catch (error) {
    console.error("Error in /api/projects:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 