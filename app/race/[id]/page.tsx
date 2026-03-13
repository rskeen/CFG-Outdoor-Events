import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDistance } from "@/lib/utils"
import { RegisterButton } from "./register-button"
import type { Race, Registration, Profile } from "@/lib/types"
import {
  MapPin,
  Navigation,
  Calendar,
  DollarSign,
  ExternalLink,
  Users,
} from "lucide-react"

interface PageProps {
  params: { id: string }
}

export default async function RacePage({ params }: PageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!race) notFound()

  const r = race as Race

  // Fetch registrations with profiles
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, profiles(display_name)")
    .eq("race_id", params.id)

  const regs = (registrations ?? []) as (Registration & {
    profiles: { display_name: string } | null
  })[]

  const registrationCount = regs.length
  const userRegistered = user
    ? regs.some((reg) => reg.user_id === user.id)
    : false

  const mapsKey = process.env.GOOGLE_MAPS_API_KEY
  const hasCoords = r.lat != null && r.lng != null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/"
        className="text-sm text-[#8a9e8a] hover:text-[#e8ede8] mb-6 inline-block"
      >
        ← Back to races
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {r.race_type && <Badge variant={r.race_type}>{r.race_type}</Badge>}
        </div>
        <h1
          className="text-4xl font-bold text-[#e8ede8] leading-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {r.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key info */}
          <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#e8ede8]">
              <Calendar className="h-4 w-4 text-[#7cb87a]" />
              <span>{formatDate(r.date)}</span>
              {r.end_date && r.end_date !== r.date && (
                <span className="text-[#8a9e8a]">– {formatDate(r.end_date)}</span>
              )}
            </div>

            {(r.location_city || r.location_state || r.location_name) && (
              <div className="flex items-center gap-2 text-[#e8ede8]">
                <MapPin className="h-4 w-4 text-[#7cb87a]" />
                <span>
                  {[r.location_name, r.location_city, r.location_state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}

            {r.distance_miles_from_woodstock != null && (
              <div className="flex items-center gap-2 text-[#8a9e8a]">
                <Navigation className="h-4 w-4" />
                <span>
                  {formatDistance(r.distance_miles_from_woodstock)} from
                  Woodstock, GA
                </span>
              </div>
            )}

            {(r.cost_min != null || r.cost_max != null) && (
              <div className="flex items-center gap-2 text-[#e8ede8]">
                <DollarSign className="h-4 w-4 text-[#7cb87a]" />
                <span>
                  {r.cost_min != null && r.cost_max != null
                    ? r.cost_min === r.cost_max
                      ? `$${r.cost_min}`
                      : `$${r.cost_min} – $${r.cost_max}`
                    : r.cost_min != null
                    ? `From $${r.cost_min}`
                    : `Up to $${r.cost_max}`}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {r.description && (
            <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-5">
              <h2
                className="text-xl font-semibold text-[#e8ede8] mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                About this Race
              </h2>
              <p className="text-[#8a9e8a] whitespace-pre-wrap leading-relaxed">
                {r.description}
              </p>
            </div>
          )}

          {/* Map */}
          {hasCoords && (
            <div className="rounded-lg border border-[#2e4530] overflow-hidden">
              {mapsKey ? (
                <iframe
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${r.lat},${r.lng}&zoom=10`}
                />
              ) : (
                <a
                  href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-24 bg-[#1a2b1c] text-[#7cb87a] hover:text-[#e8ede8] gap-2"
                >
                  <MapPin className="h-5 w-5" />
                  View on Google Maps
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Register button */}
          <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-5">
            <RegisterButton
              raceId={r.id}
              initiallyRegistered={userRegistered}
              initialCount={registrationCount}
              currentUserId={user?.id}
            />

            {r.registration_url && (
              <a
                href={r.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full rounded-md border border-[#2e4530] px-4 py-2 text-sm text-[#e8ede8] hover:bg-[#243826] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Official Registration
              </a>
            )}

            {r.race_url && (
              <a
                href={r.race_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 w-full rounded-md px-4 py-2 text-sm text-[#8a9e8a] hover:text-[#e8ede8] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Race Website
              </a>
            )}
          </div>

          {/* Group members */}
          <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-5">
            <h2
              className="text-lg font-semibold text-[#e8ede8] mb-3 flex items-center gap-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <Users className="h-4 w-4 text-[#7cb87a]" />
              CFG Members In ({registrationCount})
            </h2>
            {regs.length === 0 ? (
              <p className="text-sm text-[#8a9e8a]">
                No one yet — be the first!
              </p>
            ) : (
              <ul className="space-y-1">
                {regs.map((reg) => (
                  <li key={reg.id} className="text-sm text-[#e8ede8]">
                    {reg.profiles?.display_name ?? "Anonymous"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
