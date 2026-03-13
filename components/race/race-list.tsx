"use client"

import { useState } from "react"
import { RaceCard } from "@/components/race/race-card"
import {
  RaceFilters,
  type FiltersState,
  type RaceTypeFilter,
} from "@/components/race/race-filters"
import type { Race } from "@/lib/types"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RaceListProps {
  races: Race[]
  currentUserId?: string
}

function applyFilters(
  races: Race[],
  filters: FiltersState,
  now: Date
): Race[] {
  return races.filter((race) => {
    const raceDate = new Date(race.date)

    // Type filter
    if (filters.types.length > 0) {
      const type = (race.race_type ?? "other") as RaceTypeFilter
      if (!filters.types.includes(type)) return false
    }

    // State filter
    if (filters.state && race.location_state !== filters.state) return false

    // Only mine
    if (filters.onlyMine && !race.user_registered) return false

    // Date range
    if (filters.dateRange === "upcoming") {
      if (raceDate < now) return false
    } else if (filters.dateRange === "month") {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (raceDate < now || raceDate > endOfMonth) return false
    } else if (filters.dateRange === "3months") {
      const threeMonths = new Date(now)
      threeMonths.setMonth(threeMonths.getMonth() + 3)
      if (raceDate < now || raceDate > threeMonths) return false
    }

    return true
  })
}

export function RaceList({ races, currentUserId }: RaceListProps) {
  const [filters, setFilters] = useState<FiltersState>({
    types: [],
    state: "",
    onlyMine: false,
    dateRange: "upcoming",
  })
  const [showPast, setShowPast] = useState(false)

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const allFiltered = applyFilters(races, { ...filters, dateRange: "all" }, now)

  const upcoming = allFiltered
    .filter((r) => new Date(r.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const past = allFiltered
    .filter((r) => new Date(r.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // For dateRange filter on upcoming
  const filteredUpcoming =
    filters.dateRange === "all"
      ? upcoming
      : applyFilters(upcoming, filters, now)

  return (
    <div>
      <RaceFilters
        filters={filters}
        setFilters={setFilters}
        isLoggedIn={!!currentUserId}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredUpcoming.length === 0 ? (
          <div className="text-center py-16 text-[#8a9e8a]">
            <p className="text-lg">No races found matching your filters.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUpcoming.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div className="mt-10">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-[#8a9e8a] mb-4"
              onClick={() => setShowPast((v) => !v)}
            >
              {showPast ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Past Events ({past.length})
            </Button>

            {showPast && (
              <div className="space-y-3 opacity-60">
                {past.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
