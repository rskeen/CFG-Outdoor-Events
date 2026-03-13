import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { RaceCard } from "@/components/race/race-card"
import type { Race, Registration, Profile } from "@/lib/types"
import { Calendar, Trophy, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/dashboard")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const p = profile as Profile | null

  // Get user registrations with race data
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, races(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const regs = (registrations ?? []) as (Registration & { races: Race | null })[]
  const registeredRaces = regs
    .filter((r) => r.races)
    .map((r) => ({
      ...r.races!,
      user_registered: true,
    }))

  const now = new Date()
  const upcomingRaces = registeredRaces.filter(
    (r) => new Date(r.date) >= now
  )
  const pastRaces = registeredRaces.filter((r) => new Date(r.date) < now)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1
          className="text-4xl font-bold text-[#e8ede8]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Welcome back, {p?.display_name ?? "Racer"}!
        </h1>
        <p className="text-[#8a9e8a] mt-1">Your race dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-4 text-center">
          <div className="flex justify-center mb-2">
            <Calendar className="h-6 w-6 text-[#7cb87a]" />
          </div>
          <div className="text-2xl font-bold text-[#e8ede8]">{upcomingRaces.length}</div>
          <div className="text-xs text-[#8a9e8a]">Upcoming</div>
        </div>
        <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-4 text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-6 w-6 text-[#d4845a]" />
          </div>
          <div className="text-2xl font-bold text-[#e8ede8]">{pastRaces.length}</div>
          <div className="text-xs text-[#8a9e8a]">Completed</div>
        </div>
        <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-[#7cb87a]" />
          </div>
          <div className="text-2xl font-bold text-[#e8ede8]">{registeredRaces.length}</div>
          <div className="text-xs text-[#8a9e8a]">Total</div>
        </div>
      </div>

      {/* Upcoming races */}
      <section className="mb-8">
        <h2
          className="text-2xl font-semibold text-[#e8ede8] mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Your Upcoming Races
        </h2>
        {upcomingRaces.length === 0 ? (
          <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-8 text-center">
            <p className="text-[#8a9e8a] mb-3">No upcoming races yet.</p>
            <Link
              href="/"
              className="text-[#7cb87a] hover:underline text-sm"
            >
              Browse races →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRaces.map((race) => (
              <RaceCard key={race.id} race={race} currentUserId={user.id} />
            ))}
          </div>
        )}
      </section>

      {/* Past races */}
      {pastRaces.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold text-[#8a9e8a] mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Past Races
          </h2>
          <div className="space-y-3 opacity-70">
            {pastRaces.map((race) => (
              <RaceCard key={race.id} race={race} currentUserId={user.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
