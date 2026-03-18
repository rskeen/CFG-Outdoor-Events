"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Users, Navigation, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDistance } from "@/lib/utils"
import type { Race } from "@/lib/types"

const typeAccents: Record<string, string> = {
  trail: "#059669",
  ultra: "#14532d",
  ocr: "#c2410c",
  adventure: "#b91c1c",
  orienteering: "#0f766e",
  mtb: "#92400e",
  gravel: "#b45309",
  other: "#6b7280",
}

interface RaceCardProps {
  race: Race
  currentUserId?: string
}

export function RaceCard({ race, currentUserId }: RaceCardProps) {
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(race.user_registered ?? false)
  const [registrationCount, setRegistrationCount] = useState(race.registration_count ?? 0)
  const [loading, setLoading] = useState(false)

  const borderColor = typeAccents[race.race_type ?? "other"] ?? typeAccents.other

  const handleRegisterClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!currentUserId) {
      router.push(`/login?next=/race/${race.id}`)
      return
    }

    setLoading(true)
    const method = isRegistered ? "DELETE" : "POST"
    const prevRegistered = isRegistered
    const prevCount = registrationCount

    setIsRegistered(!isRegistered)
    setRegistrationCount((c) => (isRegistered ? c - 1 : c + 1))

    try {
      const res = await fetch(`/api/races/${race.id}/register`, { method })
      if (!res.ok) {
        setIsRegistered(prevRegistered)
        setRegistrationCount(prevCount)
      } else {
        const data = (await res.json()) as { registered: boolean; count: number }
        setIsRegistered(data.registered)
        setRegistrationCount(data.count)
      }
    } catch {
      setIsRegistered(prevRegistered)
      setRegistrationCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex cursor-pointer rounded-lg border border-[#D6D0C8] bg-white hover:bg-[#F7F4EF] transition-colors overflow-hidden group shadow-sm hover:shadow-md"
      onClick={() => router.push(`/race/${race.id}`)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/race/${race.id}`)
        }
      }}
    >
      {/* Left colored border accent */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: borderColor }} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {race.race_type && (
                <Badge variant={race.race_type}>{race.race_type}</Badge>
              )}
            </div>
            <h3
              className="text-xl font-bold text-[#1C1C1A] leading-tight truncate"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {race.name}
            </h3>
            <p className="text-sm text-[#6E6860] mt-0.5">
              {formatDate(race.date)}
              {race.end_date && race.end_date !== race.date && (
                <span> – {formatDate(race.end_date)}</span>
              )}
            </p>
            {race.summary && (
              <p className="text-sm text-[#6E6860] italic mt-1 line-clamp-1">
                {race.summary}
              </p>
            )}
          </div>

          <Button
            variant={isRegistered ? "default" : "outline"}
            size="sm"
            onClick={handleRegisterClick}
            disabled={loading}
            className={`flex-shrink-0 ${isRegistered ? "bg-[#1E5B3A] hover:bg-[#174d31] text-white border-[#1E5B3A]" : ""}`}
          >
            {isRegistered ? "✓ I'm In" : "I'm In"}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6E6860]">
          {(race.location_city || race.location_state) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[race.location_city, race.location_state].filter(Boolean).join(", ")}
            </span>
          )}
          {race.distance_miles_from_woodstock != null && (
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" />
              {formatDistance(race.distance_miles_from_woodstock)} from Woodstock
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {registrationCount > 0 ? `${registrationCount} going` : "Be the first!"}
          </span>
          {(race.registration_url || race.race_url) && (
            <a
              href={race.registration_url ?? race.race_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[#1E5B3A] hover:text-[#C4602A] transition-colors ml-auto font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{race.registration_url ? "Register" : "Race Info"}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
