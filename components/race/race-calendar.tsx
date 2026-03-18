"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  format,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RaceCard } from "@/components/race/race-card"
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

interface RaceCalendarProps {
  races: Race[]
  currentUserId?: string
}

export function RaceCalendar({ races, currentUserId }: RaceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Map races to their start date
  const racesByDay = new Map<string, Race[]>()
  for (const race of races) {
    const key = race.date.slice(0, 10) // YYYY-MM-DD
    if (!racesByDay.has(key)) racesByDay.set(key, [])
    racesByDay.get(key)!.push(race)
  }

  const selectedKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null
  const selectedRaces = selectedKey ? (racesByDay.get(selectedKey) ?? []) : []

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-md hover:bg-[#EDE9E2] text-[#6E6860] transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2
          className="text-2xl font-bold text-[#1C1C1A]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-md hover:bg-[#EDE9E2] text-[#6E6860] transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-[#6E6860] py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#D6D0C8] rounded-lg overflow-hidden border border-[#D6D0C8]">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const dayRaces = racesByDay.get(key) ?? []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          const isTodayDay = isToday(day)

          return (
            <button
              key={key}
              onClick={() => {
                if (dayRaces.length > 0) {
                  setSelectedDay(isSelected ? null : day)
                }
              }}
              className={`
                relative bg-white p-1.5 min-h-[80px] text-left transition-colors
                ${!isCurrentMonth ? "bg-[#F7F4EF]" : ""}
                ${isSelected ? "bg-[#EDE9E2]" : isCurrentMonth ? "hover:bg-[#F7F4EF]" : ""}
                ${dayRaces.length > 0 ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {/* Day number */}
              <span
                className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium
                  ${isTodayDay ? "bg-[#1E5B3A] text-white" : isCurrentMonth ? "text-[#1C1C1A]" : "text-[#D6D0C8]"}
                `}
              >
                {format(day, "d")}
              </span>

              {/* Race dots */}
              {dayRaces.length > 0 && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {dayRaces.slice(0, 3).map((race) => (
                    <div
                      key={race.id}
                      className="flex items-center gap-1"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            typeAccents[race.race_type ?? "other"] ?? typeAccents.other,
                        }}
                      />
                      <span className="text-xs text-[#1C1C1A] truncate leading-tight hidden sm:block">
                        {race.name}
                      </span>
                    </div>
                  ))}
                  {dayRaces.length > 3 && (
                    <span className="text-xs text-[#6E6860] ml-2.5">
                      +{dayRaces.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day race cards */}
      {selectedDay && selectedRaces.length > 0 && (
        <div className="mt-6">
          <h3
            className="text-lg font-bold text-[#1C1C1A] mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {format(selectedDay, "EEEE, MMMM d")}
          </h3>
          <div className="space-y-3">
            {selectedRaces.map((race) => (
              <RaceCard key={race.id} race={race} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      )}

      {races.length === 0 && (
        <div className="text-center py-16 text-[#6E6860]">
          <p className="text-lg">No upcoming races found.</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}
