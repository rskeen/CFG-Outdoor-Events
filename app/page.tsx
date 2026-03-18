import { createClient } from "@/lib/supabase/server"
import { RaceList } from "@/components/race/race-list"
import type { Race } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch active races
  const { data: races } = await supabase
    .from("races")
    .select("*")
    .eq("is_active", true)
    .order("date", { ascending: true })

  // Fetch registration counts
  const { data: regCounts } = await supabase
    .from("registrations")
    .select("race_id")

  // If logged in, fetch user's registrations
  let userRegistrations: string[] = []
  if (user) {
    const { data: userRegs } = await supabase
      .from("registrations")
      .select("race_id")
      .eq("user_id", user.id)
    userRegistrations = (userRegs ?? []).map((r: { race_id: string }) => r.race_id)
  }

  // Build count map
  const countMap: Record<string, number> = {}
  for (const reg of regCounts ?? []) {
    const r = reg as { race_id: string }
    countMap[r.race_id] = (countMap[r.race_id] ?? 0) + 1
  }

  const enrichedRaces: Race[] = (races ?? []).map((race: Race) => ({
    ...race,
    registration_count: countMap[race.id] ?? 0,
    user_registered: userRegistrations.includes(race.id),
  }))

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <h1
          className="text-4xl font-bold text-[#1E5B3A]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Upcoming Races
        </h1>
        <p className="text-[#6E6860] mt-1">
          Outdoor endurance events in the Southeast US
        </p>
      </div>
      <RaceList races={enrichedRaces} currentUserId={user?.id} />
    </div>
  )
}
