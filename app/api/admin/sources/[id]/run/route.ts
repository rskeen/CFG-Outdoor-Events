import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

interface RouteParams {
  params: { id: string }
}

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

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = getServiceClient()

  // Check the source exists
  const { data: source, error: sourceError } = await service
    .from("scraper_sources")
    .select("*")
    .eq("id", params.id)
    .single()

  if (sourceError || !source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  const scraperUrl = process.env.RAILWAY_SCRAPER_URL

  if (!scraperUrl) {
    // Log placeholder — scraper not configured
    await service.from("scraper_sources").update({
      last_run_at: new Date().toISOString(),
      last_error: "Manual run triggered (scraper service not configured)",
    }).eq("id", params.id)

    return NextResponse.json({
      message: "Scraper service not configured. Run logged.",
      source_id: params.id,
    })
  }

  // Trigger the Railway scraper service
  try {
    const response = await fetch(`${scraperUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: params.id }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      await service.from("scraper_sources").update({
        last_error: `HTTP ${response.status}: ${errorText}`,
      }).eq("id", params.id)

      return NextResponse.json(
        { error: `Scraper returned ${response.status}` },
        { status: 500 }
      )
    }

    const result = (await response.json()) as Record<string, unknown>
    return NextResponse.json({ success: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await service.from("scraper_sources").update({
      last_error: message,
    }).eq("id", params.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
