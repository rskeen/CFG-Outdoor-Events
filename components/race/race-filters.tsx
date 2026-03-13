"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export type DateRange = "upcoming" | "month" | "3months" | "all"

export type RaceTypeFilter =
  | "trail"
  | "ultra"
  | "ocr"
  | "adventure"
  | "orienteering"
  | "mtb"
  | "gravel"
  | "other"

export interface FiltersState {
  types: RaceTypeFilter[]
  state: string
  onlyMine: boolean
  dateRange: DateRange
}

const RACE_TYPES: RaceTypeFilter[] = [
  "trail",
  "ultra",
  "ocr",
  "adventure",
  "orienteering",
  "mtb",
  "gravel",
  "other",
]

const US_STATES = [
  "AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV",
  "AK", "AZ", "CA", "CO", "CT", "DE", "HI", "ID", "IL", "IN", "IA", "KS",
  "ME", "MD", "MA", "MI", "MN", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "ND", "OH", "OK", "OR", "PA", "RI", "SD", "TX", "UT", "VT", "WA",
  "WI", "WY",
]

interface RaceFiltersProps {
  filters: FiltersState
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  isLoggedIn: boolean
}

export function RaceFilters({
  filters,
  setFilters,
  isLoggedIn,
}: RaceFiltersProps) {
  const toggleType = (type: RaceTypeFilter) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  return (
    <div className="sticky top-16 z-30 bg-[#0f1710]/95 backdrop-blur-sm border-b border-[#2e4530] py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {/* Race type pills */}
        <div className="flex flex-wrap gap-2">
          {RACE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "transition-opacity",
                !filters.types.includes(type) &&
                  filters.types.length > 0 &&
                  "opacity-40"
              )}
            >
              <Badge variant={type}>{type}</Badge>
            </button>
          ))}
          {filters.types.length > 0 && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, types: [] }))}
              className="text-xs text-[#8a9e8a] hover:text-[#e8ede8] underline"
            >
              clear
            </button>
          )}
        </div>

        {/* Bottom row filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* State filter */}
          <div className="w-40">
            <Select
              value={filters.state || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  state: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="w-44">
            <Select
              value={filters.dateRange}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: val as DateRange,
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="3months">Next 3 months</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Only my races */}
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <Switch
                id="only-mine"
                checked={filters.onlyMine}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, onlyMine: checked }))
                }
              />
              <Label htmlFor="only-mine" className="text-xs cursor-pointer">
                Only my races
              </Label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
