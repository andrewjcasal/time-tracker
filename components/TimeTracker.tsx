"use client"

import { useState, useEffect } from "react"
import { createTimeEntry } from "@/lib/supabase"
import { Command } from "cmdk"

interface Project {
  id: string
  name: string
  tasks?: Task[]
}

interface Task {
  id: string
  name: string
  project_id: string
  completed: boolean
}

interface TimeEntry {
  id: string
  projectName: string
  startTime: number
  endTime: number
  duration: number
  description?: string
}

interface TimeTrackerProps {
  onSaveEntry: (entry: TimeEntry) => void
  projects: Project[]
}

interface SearchResult {
  id: string
  type: "project" | "task"
  name: string
  projectId: string
  projectName?: string
}

interface RecentTask {
  id: string
  type: "project" | "task"
  name: string
  projectId: string
  projectName?: string
}

export default function TimeTracker({
  onSaveEntry,
  projects,
}: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [description, setDescription] = useState("")
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }

    const searchLower = search.toLowerCase()
    const results: SearchResult[] = []

    projects.forEach((project) => {
      // Search in project names
      if (project.name.toLowerCase().includes(searchLower)) {
        results.push({
          id: project.id,
          type: "project",
          name: project.name,
          projectId: project.id,
        })
      }

      // Search in tasks
      project.tasks?.forEach((task) => {
        if (task.name.toLowerCase().includes(searchLower)) {
          results.push({
            id: task.id,
            type: "task",
            name: task.name,
            projectId: project.id,
            projectName: project.name,
          })
        }
      })
    })

    setSearchResults(results)
  }, [search, projects])

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (isTracking && startTime) {
      intervalId = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 1000)
    }
    return () => clearInterval(intervalId)
  }, [isTracking, startTime])

  const startTimer = async () => {
    if (!selectedItem) {
      alert("Please select a project or task")
      return
    }

    setIsTracking(true)
    setStartTime(Date.now())
  }

  const stopTimer = async () => {
    if (!startTime || !selectedItem) return

    try {
      const endTime = new Date()
      const startDate = new Date(startTime)

      // Save to Supabase
      await createTimeEntry(
        selectedItem.projectId,
        startDate,
        endTime,
        description,
        selectedItem.type === "task" ? selectedItem.id : undefined // Pass task ID if it's a task
      )

      // Update local state
      const entry: TimeEntry = {
        id: selectedItem.id,
        projectName:
          selectedItem.type === "task"
            ? `${selectedItem.projectName} - ${selectedItem.name}`
            : selectedItem.name,
        startTime,
        endTime: endTime.getTime(),
        duration: elapsedTime,
        description: description.trim() || undefined,
      }
      onSaveEntry(entry)

      // Reset state
      setIsTracking(false)
      setSearch("")
      setElapsedTime(0)
      setStartTime(null)
      setSelectedItem(null)
      setDescription("")
    } catch (error) {
      console.error("Error stopping timer:", error)
      alert("Failed to save time entry")
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 1000 / 60) % 60)
    const hours = Math.floor(ms / 1000 / 60 / 60)
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Add to recent tasks when selecting an item
  const handleSelect = (result: SearchResult) => {
    setSelectedItem(result)
    setSearch(
      result.type === "task"
        ? `${result.projectName} - ${result.name}`
        : result.name
    )
    setIsOpen(false)

    // Add to recent tasks
    setRecentTasks((prev) => {
      // Remove if already exists
      const filtered = prev.filter((task) => task.id !== result.id)
      // Add to beginning of array
      return [result, ...filtered].slice(0, 5) // Keep only last 5
    })
  }

  return (
    <div className="bg-[#2b2d31] p-6 rounded-lg shadow-lg mb-6 border border-[#1e1f22]">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Command className="relative z-50 w-full" shouldFilter={false}>
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search projects and tasks..."
                className="w-full p-2 rounded bg-[#383a40] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] outline-none"
                onFocus={() => setIsOpen(true)}
              />
              {isOpen && search && (
                <div className="absolute w-full mt-1 rounded-md bg-[#383a40] border border-[#1e1f22] shadow-lg overflow-hidden">
                  <Command.List className="max-h-[300px] overflow-y-auto py-2">
                    {searchResults.length === 0 ? (
                      <Command.Empty className="px-4 py-2 text-sm text-gray-400">
                        No results found
                      </Command.Empty>
                    ) : (
                      searchResults.map((result) => (
                        <Command.Item
                          key={`${result.type}-${result.id}`}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="px-4 py-2 text-white hover:bg-[#404249] cursor-pointer"
                        >
                          <div className="flex items-center">
                            <span className="mr-2">
                              {result.type === "project" ? "📁" : "📄"}
                            </span>
                            {result.type === "task" ? (
                              <div>
                                <div className="font-medium">{result.name}</div>
                                <div className="text-sm text-gray-400">
                                  {result.projectName}
                                </div>
                              </div>
                            ) : (
                              result.name
                            )}
                          </div>
                        </Command.Item>
                      ))
                    )}
                  </Command.List>
                </div>
              )}
            </Command>
          </div>
          {!isTracking ? (
            <button
              onClick={startTimer}
              className="bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition-colors self-end"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="bg-[#ed4245] text-white px-4 py-2 rounded hover:bg-[#c53437] transition-colors self-end"
            >
              Stop
            </button>
          )}
        </div>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && !isTracking && (
          <div className="flex flex-wrap gap-2">
            {recentTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleSelect(task)}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#383a40] text-white rounded hover:bg-[#404249] transition-colors"
              >
                <span className="text-xs">
                  {task.type === "project" ? "📁" : "📄"}
                </span>
                {task.type === "task" ? (
                  <span>
                    {task.name}
                    <span className="text-gray-400 text-xs ml-1">
                      in {task.projectName}
                    </span>
                  </span>
                ) : (
                  task.name
                )}
              </button>
            ))}
          </div>
        )}

        {isTracking && (
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm text-gray-400">
              What are you working on? (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about what you're working on..."
              className="w-full p-2 rounded bg-[#383a40] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] outline-none resize-none h-20"
            />
          </div>
        )}

        <div className="text-3xl font-mono text-center text-white">
          {formatTime(elapsedTime)}
        </div>
      </div>
    </div>
  )
}
