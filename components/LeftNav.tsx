"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LeftNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const navItems = [
    { name: "Timer", path: "/" },
    { name: "Projects", path: "/projects" },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2b2d31] text-white hover:bg-[#383a40] transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transform fixed left-0 top-0 z-40 w-64 h-screen bg-[#2b2d31] border-r border-[#1e1f22] transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col`}
      >
        <div className="p-4 pt-16 md:pt-4 flex-1">
          <h1 className="text-white text-xl font-bold mb-6">Time Tracker</h1>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => isMobile && setIsOpen(false)}
                className={`flex items-center px-4 py-2 rounded transition-colors ${
                  pathname === item.path
                    ? "bg-[#404249] text-white"
                    : "text-gray-400 hover:bg-[#383a40] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-[#1e1f22]">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-gray-400 hover:bg-[#383a40] hover:text-white rounded transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  )
}
