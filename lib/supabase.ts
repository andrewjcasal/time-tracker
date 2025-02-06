import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database.types"

export const supabase = createClientComponentClient<Database>()

export async function createTimeEntry(
  projectId: string, 
  startTime: Date, 
  endTime: Date,
  description?: string,
  taskId?: string
) {
  const duration = endTime.getTime() - startTime.getTime()
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      project_id: projectId,
      task_id: taskId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: `${Math.floor(duration / 1000)} seconds`,
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTimeEntries() {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      projects (
        name
      ),
      tasks (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createProject(name: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      user_id: userData.user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function deleteTimeEntry(id: string) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateTimeEntry(
  id: string,
  startTime: Date,
  endTime: Date,
  description?: string
) {
  const duration = endTime.getTime() - startTime.getTime()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('User not authenticated')

  // Update the entry
  const { data, error } = await supabase
    .from('time_entries')
    .update({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: `${Math.floor(duration / 1000)} seconds`,
      description: description?.trim() || null,
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure we only update user's own entries
    .select()

  if (error) {
    console.error('Update error:', error)
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error('Time entry not found or access denied')
  }

  return data[0]
}