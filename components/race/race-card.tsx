"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Users, Navigation, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDistance } from "@/lib/utils"
import type { Race } from "@/lib/types"

const typeColors: Record<string, string> = {
  trail: "#4ade80",
  ultra: "#166534",
  ocr: "#f97316",
  adventure: "#ef4444",
  orienteering: "#14b8a6",
  mtb: "#92400e",
  gravel: "#d97706",
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

  const borderColor = typeColors[race.race_type ?? "other"] ?? typeColors.other

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
      className="relative flex cursor-pointer rounded-lg border border-[#2e4530] bg-[#1a2b1c] hover:bg-[#243826] transition-colors overflow-hidden group"
      onClick={() => router.push(`/race/${race.id}`)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/race/${race.id}`)
        }
      }}
    >
      {/* Left colored border */}
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
              className="text-xl font-bold text-[#e8ede8] leading-tight truncate"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {race.name}
            </h3>
            <p className="text-sm text-[#8a9e8a] mt-1">
              {formatDate(race.date)}
              {race.end_date && race.end_date !== race.date && (
                <span> – {formatDate(race.end_date)}</span>
              )}
            </p>
          </div>

          <Button
            variant={isRegistered ? "default" : "outline"}
            size="sm"
            onClick={handleRegisterClick}
            disabled={loading}
            className="flex-shrink-0"
          >
            {isRegistered ? "✓ I'm In" : "I'm In"}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8a9e8a]">
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
              className="flex items-center gap-1 text-[#7cb87a] hover:text-[#d4845a] transition-colors ml-auto"
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
