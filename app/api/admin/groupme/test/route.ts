import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendGroupmeMessage } from "@/lib/groupme"

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
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

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as { message?: string }
  const message =
    body.message ?? "🏃 CFG Outdoor Events test message! The bot is working."

  try {
    await sendGroupmeMessage(message)

    // Log to groupme_posts
    const service = getServiceClient()
    await service.from("groupme_posts").insert({
      race_id: null,
      trigger_type: "registration",
      message,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
