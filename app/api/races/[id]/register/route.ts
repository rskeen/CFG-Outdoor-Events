import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { sendGroupmeMessage } from "@/lib/groupme"
import { formatDate } from "@/lib/utils"
import type { Race, Profile } from "@/lib/types"

interface RouteParams {
  params: { id: string }
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getCount(raceId: string): Promise<number> {
  const service = getServiceClient()
  const { count } = await service
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("race_id", raceId)
  return count ?? 0
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = getServiceClient()

  // Check if already registered
  const { data: existing } = await service
    .from("registrations")
    .select("id")
    .eq("race_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    const count = await getCount(params.id)
    return NextResponse.json({ registered: true, count })
  }

  // Insert registration
  const { error } = await service.from("registrations").insert({
    race_id: params.id,
    user_id: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = await getCount(params.id)

  // Fetch race and profile for GroupMe message
  try {
    const [{ data: race }, { data: profile }] = await Promise.all([
      service.from("races").select("*").eq("id", params.id).single(),
      service.from("profiles").select("*").eq("id", user.id).single(),
    ])

    if (race && profile) {
      const r = race as Race
      const p = profile as Profile
      const location = [r.location_city, r.location_state]
        .filter(Boolean)
        .join(", ")
      const message =
        `${p.display_name} just signed up for ${r.name} on ${formatDate(r.date)}` +
        (location ? ` in ${location}` : "") +
        `! 🏃 ${count} from the group are in.` +
        (r.race_url ? ` Details: ${r.race_url}` : "")

      await sendGroupmeMessage(message)

      // Log to groupme_posts
      await service.from("groupme_posts").insert({
        race_id: params.id,
        trigger_type: "registration",
        message,
        sent_at: new Date().toISOString(),
      })
    }
  } catch {
    // GroupMe errors shouldn't fail the registration
  }

  return NextResponse.json({ registered: true, count })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = getServiceClient()

  const { error } = await service
    .from("registrations")
    .delete()
    .eq("race_id", params.id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = await getCount(params.id)
  return NextResponse.json({ registered: false, count })
}
