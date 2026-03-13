"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

const MAX_ADMINS = 3

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)

    const res = await fetch("/api/admin/users")
    if (res.ok) {
      const data = (await res.json()) as Profile[]
      setProfiles(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (
    profile: Profile,
    newRole: "admin" | "user"
  ) => {
    setError(null)
    setUpdating(profile.id)

    const res = await fetch(`/api/admin/users/${profile.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })

    setUpdating(null)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Failed to update role")
      return
    }

    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
    )
  }

  const adminCount = profiles.filter((p) => p.role === "admin").length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profiles.length} total · {adminCount}/{MAX_ADMINS} admins
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Display Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Joined
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Role
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((profile) => {
                const isSelf = profile.id === currentUser?.id
                const isAdmin = profile.role === "admin"
                const canPromote = !isAdmin && adminCount < MAX_ADMINS
                const canDemote = isAdmin && !isSelf

                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {profile.display_name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isAdmin
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canPromote && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleChange(profile, "admin")}
                          disabled={updating === profile.id}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {updating === profile.id ? "..." : "Promote to Admin"}
                        </Button>
                      )}
                      {canDemote && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRoleChange(profile, "user")}
                          disabled={updating === profile.id}
                        >
                          {updating === profile.id ? "..." : "Demote"}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
