export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          user_id?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          project_id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration: string | null
          created_at: string
          description: string | null
          tasks: {
            name: string
          } | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration?: string | null
          created_at?: string
          description?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration?: string | null
          created_at?: string
          description?: string | null
        }
      }
      tasks1: {
        Row: {
          id: string
          project_id: string
          name: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          completed?: boolean
          created_at?: string
        }
      }
    }
  }
} 