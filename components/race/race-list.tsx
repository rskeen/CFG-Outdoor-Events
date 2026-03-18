"use client"

import { useState } from "react"
import { RaceCard } from "@/components/race/race-card"
import { RaceCalendar } from "@/components/race/race-calendar"
import {
  RaceFilters,
  type FiltersState,
  type RaceTypeFilter,
} from "@/components/race/race-filters"
import type { Race } from "@/lib/types"
import { ChevronDown, ChevronUp, LayoutList, CalendarDays } from "lucide-react"
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

    // Distance filter
    if (
      filters.maxDistance !== null &&
      race.distance_miles_from_woodstock != null &&
      race.distance_miles_from_woodstock > filters.maxDistance
    ) {
      return false
    }

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
    maxDistance: 400,
  })
  const [showPast, setShowPast] = useState(false)
  const [view, setView] = useState<"list" | "calendar">("list")

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
        {/* View toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md border border-[#D6D0C8] overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "list"
                  ? "bg-[#1E5B3A] text-white"
                  : "bg-white text-[#6E6860] hover:bg-[#EDE9E2]"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#D6D0C8] transition-colors ${
                view === "calendar"
                  ? "bg-[#1E5B3A] text-white"
                  : "bg-white text-[#6E6860] hover:bg-[#EDE9E2]"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>

        {view === "calendar" ? (
          <RaceCalendar races={filteredUpcoming} currentUserId={currentUserId} />
        ) : filteredUpcoming.length === 0 ? (
          <div className="text-center py-16 text-[#6E6860]">
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

        {/* Past events — only in list view */}
        {view === "list" && past.length > 0 && (
          <div className="mt-10">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-[#6E6860] mb-4"
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
