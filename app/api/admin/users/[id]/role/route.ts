import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

interface RouteParams {
  params: { id: string }
}

const MAX_ADMINS = 3

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAdminUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const service = getServiceClient()
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") return null
  return user
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as { role: "user" | "admin" }
  const newRole = body.role

  if (!["user", "admin"].includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Prevent self-demotion
  if (params.id === adminUser.id && newRole === "user") {
    return NextResponse.json(
      { error: "You cannot demote yourself" },
      { status: 400 }
    )
  }

  const service = getServiceClient()

  // Enforce max admins when promoting
  if (newRole === "admin") {
    const { count } = await service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")

    if ((count ?? 0) >= MAX_ADMINS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ADMINS} admins allowed` },
        { status: 400 }
      )
    }
  }

  const { data, error } = await service
    .from("profiles")
    .update({ role: newRole })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
