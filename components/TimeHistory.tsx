"use client"

import { useState } from "react"
import { deleteTimeEntry, updateTimeEntry } from "@/lib/supabase"

interface TimeEntry {
  id: string
  projectName: string
  startTime: number
  endTime: number
  duration: number
  description?: string
}

interface TimeHistoryProps {
  entries: TimeEntry[]
  onDelete: (id: string) => void
  onUpdate: (id: string) => void
}

export default function TimeHistory({
  entries,
  onDelete,
  onUpdate,
}: TimeHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    startTime: "",
    endTime: "",
    description: "",
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDateForInput = (timestamp: number) => {
    // Convert to local timezone and format for datetime-local input
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 1000 / 60) % 60)
    const hours = Math.floor(ms / 1000 / 60 / 60)
    const decimalHours = (ms / (1000 * 60 * 60)).toFixed(2)

    return `${hours}h ${minutes}m ${seconds}s (${decimalHours}h)`
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditingId(entry.id)
    setEditForm({
      startTime: formatDateForInput(entry.startTime),
      endTime: formatDateForInput(entry.endTime),
      description: entry.description || "",
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({
      startTime: "",
      endTime: "",
      description: "",
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      // Convert input strings to local Date objects
      const startDate = new Date(editForm.startTime)
      const endDate = new Date(editForm.endTime)

      await updateTimeEntry(id, startDate, endDate, editForm.description)
      onUpdate(id)
      setEditingId(null)
    } catch (error) {
      console.error("Error updating time entry:", error)
      alert("Failed to update time entry")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return

    try {
      await deleteTimeEntry(id)
      onDelete(id)
    } catch (error) {
      console.error("Error deleting time entry:", error)
      alert("Failed to delete time entry")
    }
  }

  return (
    <div className="bg-[#2b2d31] p-6 rounded-lg shadow-lg border border-[#1e1f22]">
      <h2 className="text-xl font-bold mb-4 text-white">Time History</h2>
      {entries.length === 0 ? (
        <p className="text-gray-400">No time entries yet</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border-b border-[#1e1f22] pb-4 last:border-b-0 last:pb-0 hover:bg-[#383a40] -mx-6 px-6 transition-colors group"
            >
              {editingId === entry.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.startTime}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startTime: e.target.value })
                      }
                      className="w-full p-2 rounded bg-[#383a40] border-none text-white focus:ring-2 focus:ring-[#5865f2] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.endTime}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endTime: e.target.value })
                      }
                      className="w-full p-2 rounded bg-[#383a40] border-none text-white focus:ring-2 focus:ring-[#5865f2] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded bg-[#383a40] border-none text-white focus:ring-2 focus:ring-[#5865f2] outline-none resize-none h-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(entry.id)}
                      className="bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-[#ed4245] text-white px-4 py-2 rounded hover:bg-[#c53437] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white flex items-baseline gap-2">
                      <span>{entry.projectName}</span>
                      {entry.description && (
                        <span className="text-sm text-gray-400">
                          {entry.description}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(entry.startTime)} -{" "}
                      {formatDate(entry.endTime)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Duration: {formatDuration(entry.duration)}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-gray-500 hover:text-[#5865f2]"
                      title="Edit entry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-gray-500 hover:text-[#ed4245]"
                      title="Delete entry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
