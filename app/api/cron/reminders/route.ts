import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateGroupmePost } from "@/lib/anthropic"
import { sendGroupmeMessage } from "@/lib/groupme"
import { formatDate } from "@/lib/utils"
import type { Race } from "@/lib/types"

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}


export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = getServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const milestones: { months: number; triggerType: "4_month" | "2_month" | "1_month" }[] = [
    { months: 4, triggerType: "4_month" },
    { months: 2, triggerType: "2_month" },
    { months: 1, triggerType: "1_month" },
  ]

  const results: { raceId: string; triggerType: string; sent: boolean }[] = []

  for (const { months, triggerType } of milestones) {
    const targetDate = addMonths(today, months)

    // Find races on this target date with registrations
    const { data: races } = await service
      .from("races")
      .select("*")
      .eq("is_active", true)
      .gte("date", targetDate.toISOString().split("T")[0])
      .lt(
        "date",
        new Date(targetDate.getTime() + 86400000).toISOString().split("T")[0]
      )

    for (const race of races ?? []) {
      const r = race as Race

      // Check if we already sent this type for this race
      const { data: existing } = await service
        .from("groupme_posts")
        .select("id")
        .eq("race_id", r.id)
        .eq("trigger_type", triggerType)
        .single()

      if (existing) {
        results.push({ raceId: r.id, triggerType, sent: false })
        continue
      }

      // Check if any registrations
      const { count } = await service
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("race_id", r.id)

      if (!count || count === 0) {
        results.push({ raceId: r.id, triggerType, sent: false })
        continue
      }

      // Generate message via Claude
      const location = [r.location_city, r.location_state]
        .filter(Boolean)
        .join(", ")

      const prompt = `Write a GroupMe reminder for CFG members: "${r.name}" is ${months} month${months > 1 ? "s" : ""} away on ${formatDate(r.date)}${location ? ` in ${location}` : ""}. ${count} member${count > 1 ? "s" : ""} registered. Encourage others to sign up!`

      try {
        const message = await generateGroupmePost(prompt)
        await sendGroupmeMessage(message)

        await service.from("groupme_posts").insert({
          race_id: r.id,
          trigger_type: triggerType,
          message,
          sent_at: new Date().toISOString(),
        })

        results.push({ raceId: r.id, triggerType, sent: true })
      } catch {
        results.push({ raceId: r.id, triggerType, sent: false })
      }
    }
  }

  return NextResponse.json({ date: today.toISOString(), results })
}
