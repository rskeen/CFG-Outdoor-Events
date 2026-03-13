"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Race } from "@/lib/types"

interface RaceFormProps {
  race?: Partial<Race>
  onSuccess: () => void
  onCancel: () => void
}

const RACE_TYPES = [
  "trail",
  "ultra",
  "ocr",
  "adventure",
  "orienteering",
  "mtb",
  "gravel",
  "other",
]

export function RaceForm({ race, onSuccess, onCancel }: RaceFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: race?.name ?? "",
    race_type: race?.race_type ?? "",
    date: race?.date ? race.date.split("T")[0] : "",
    end_date: race?.end_date ? race.end_date.split("T")[0] : "",
    location_name: race?.location_name ?? "",
    location_city: race?.location_city ?? "",
    location_state: race?.location_state ?? "",
    lat: race?.lat?.toString() ?? "",
    lng: race?.lng?.toString() ?? "",
    description: race?.description ?? "",
    registration_url: race?.registration_url ?? "",
    race_url: race?.race_url ?? "",
    cost_min: race?.cost_min?.toString() ?? "",
    cost_max: race?.cost_max?.toString() ?? "",
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      ...form,
      race_type: form.race_type || null,
      end_date: form.end_date || null,
      location_name: form.location_name || null,
      location_city: form.location_city || null,
      location_state: form.location_state || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      description: form.description || null,
      registration_url: form.registration_url || null,
      race_url: form.race_url || null,
      cost_min: form.cost_min ? parseFloat(form.cost_min) : null,
      cost_max: form.cost_max ? parseFloat(form.cost_max) : null,
      manually_added: true,
    }

    const method = race?.id ? "PUT" : "POST"
    const body = race?.id ? { ...payload, id: race.id } : payload

    const res = await fetch("/api/admin/races", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Failed to save race")
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="name">Race Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label>Race Type</Label>
          <Select
            value={form.race_type}
            onValueChange={(v) => set("race_type", v)}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {RACE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="location_name">Venue Name</Label>
          <Input
            id="location_name"
            value={form.location_name}
            onChange={(e) => set("location_name", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="location_city">City</Label>
          <Input
            id="location_city"
            value={form.location_city}
            onChange={(e) => set("location_city", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="location_state">State</Label>
          <Input
            id="location_state"
            value={form.location_state}
            onChange={(e) => set("location_state", e.target.value)}
            maxLength={2}
            placeholder="GA"
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => set("lat", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => set("lng", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cost_min">Cost Min ($)</Label>
          <Input
            id="cost_min"
            type="number"
            step="0.01"
            value={form.cost_min}
            onChange={(e) => set("cost_min", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cost_max">Cost Max ($)</Label>
          <Input
            id="cost_max"
            type="number"
            step="0.01"
            value={form.cost_max}
            onChange={(e) => set("cost_max", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="registration_url">Registration URL</Label>
          <Input
            id="registration_url"
            type="url"
            value={form.registration_url}
            onChange={(e) => set("registration_url", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="race_url">Race Website URL</Label>
          <Input
            id="race_url"
            type="url"
            value={form.race_url}
            onChange={(e) => set("race_url", e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          {loading ? "Saving..." : race?.id ? "Update Race" : "Add Race"}
        </Button>
      </div>
    </form>
  )
}
