import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Flag, Database, Users, MessageSquare, ChevronRight } from "lucide-react"

const navLinks = [
  { href: "/admin/races", label: "Races", icon: Flag },
  { href: "/admin/sources", label: "Sources", icon: Database },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/groupme", label: "GroupMe", icon: MessageSquare },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/admin/races")

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="block">
            <span
              className="text-lg font-bold text-green-700"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              CFG Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
