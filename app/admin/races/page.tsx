"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RaceForm } from "./race-form"
import { formatDate } from "@/lib/utils"
import type { Race } from "@/lib/types"
import { Plus, Pencil } from "lucide-react"

export default function AdminRacesPage() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<Race | undefined>(undefined)

  const loadRaces = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/races")
    if (res.ok) {
      const data = (await res.json()) as Race[]
      setRaces(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRaces()
  }, [])

  const handleToggleActive = async (race: Race) => {
    const res = await fetch(`/api/admin/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !race.is_active }),
    })
    if (res.ok) {
      setRaces((prev) =>
        prev.map((r) =>
          r.id === race.id ? { ...r, is_active: !race.is_active } : r
        )
      )
    }
  }

  const openAdd = () => {
    setEditingRace(undefined)
    setDialogOpen(true)
  }

  const openEdit = (race: Race) => {
    setEditingRace(race)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Races</h1>
          <p className="text-sm text-gray-500 mt-0.5">{races.length} total</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Race Manually
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Location
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">
                  Active
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {races.map((race) => (
                <tr key={race.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {race.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(race.date)}
                  </td>
                  <td className="px-4 py-3">
                    {race.race_type && (
                      <Badge variant={race.race_type}>{race.race_type}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[race.location_city, race.location_state]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={race.is_active}
                      onCheckedChange={() => handleToggleActive(race)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(race)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingRace ? "Edit Race" : "Add Race Manually"}
            </DialogTitle>
          </DialogHeader>
          <RaceForm
            race={editingRace}
            onSuccess={() => {
              setDialogOpen(false)
              loadRaces()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
