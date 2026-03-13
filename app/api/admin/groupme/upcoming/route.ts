import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Race } from "@/lib/types"

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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = getServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const milestoneMonths = [1, 2, 4]
  const results: {
    race: Race
    registrationCount: number
    daysUntil: number
    monthsUntil: number
  }[] = []

  for (const months of milestoneMonths) {
    const targetStart = addMonths(today, months)
    // Get races within a window of ±3 days of each milestone
    const windowStart = new Date(targetStart.getTime() - 3 * 86400000)
    const windowEnd = new Date(targetStart.getTime() + 3 * 86400000)

    const { data: races } = await service
      .from("races")
      .select("*")
      .eq("is_active", true)
      .gte("date", windowStart.toISOString().split("T")[0])
      .lte("date", windowEnd.toISOString().split("T")[0])

    for (const race of races ?? []) {
      const r = race as Race
      const { count } = await service
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("race_id", r.id)

      if (!count || count === 0) continue

      const raceDate = new Date(r.date)
      const daysUntil = Math.round(
        (raceDate.getTime() - today.getTime()) / 86400000
      )

      results.push({
        race: r,
        registrationCount: count,
        daysUntil,
        monthsUntil: months,
      })
    }
  }

  // Sort by date
  results.sort((a, b) => new Date(a.race.date).getTime() - new Date(b.race.date).getTime())

  return NextResponse.json(results)
}
