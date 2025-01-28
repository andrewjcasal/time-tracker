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

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select(`
        *,
        projects (
          name
        ),
        tasks1 (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedEntries = entries.map((entry) => ({
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

    return NextResponse.json(formattedEntries)
  } catch (error) {
    console.error("Error in /api/time-entries:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 