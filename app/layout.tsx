import type { Metadata } from "next";
import { Inter } from "next/font/google"
import "./globals.css"
import LeftNav from "@/components/LeftNav"
import { AuthProvider } from "@/providers/AuthProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Time Tracker",
  description: "Track your time on projects and tasks",
}

// Force dynamic rendering for auth
export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#313338]`}>
        <AuthProvider>
          <LeftNav />
          <div className="md:pl-64 transition-[padding] duration-200">
            <div className="container mx-auto p-4 max-w-3xl">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
