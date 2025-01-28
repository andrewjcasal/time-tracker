import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth routes handling
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth")
  if (isAuthRoute) {
    return res
  }

  // If user is not signed in and the current path is not /login,
  // redirect the user to /login
  if (!user && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If user is signed in and the current path is /login,
  // redirect the user to /
  if (user && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
} 