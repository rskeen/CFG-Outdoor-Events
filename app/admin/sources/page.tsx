"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddSourceForm } from "./add-source-form"
import type { ScraperSource } from "@/lib/types"
import { Plus, Play, AlertCircle } from "lucide-react"

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<ScraperSource[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)

  const loadSources = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/sources")
    if (res.ok) {
      const data = (await res.json()) as ScraperSource[]
      setSources(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSources()
  }, [])

  const handleToggleActive = async (source: ScraperSource) => {
    const res = await fetch(`/api/admin/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !source.active }),
    })
    if (res.ok) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, active: !source.active } : s
        )
      )
    }
  }

  const handleRunNow = async (source: ScraperSource) => {
    setRunningId(source.id)
    await fetch(`/api/admin/sources/${source.id}/run`, { method: "POST" })
    setRunningId(null)
    loadSources()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraper Sources</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sources.length} sources configured
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Source
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    {source.race_type && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {source.race_type}
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {source.render_method ?? "static"}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {source.url}
                  </a>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {source.last_run_at && (
                      <span>
                        Last run:{" "}
                        {new Date(source.last_run_at).toLocaleDateString()}
                      </span>
                    )}
                    {source.last_error && (
                      <span className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {source.last_error.slice(0, 80)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Switch
                    checked={source.active}
                    onCheckedChange={() => handleToggleActive(source)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(source)}
                    disabled={runningId === source.id}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {runningId === source.id ? "Running..." : "Run Now"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {sources.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No sources configured yet. Add your first source to start scraping races.
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New Source</DialogTitle>
          </DialogHeader>
          <AddSourceForm
            onSuccess={() => {
              setDialogOpen(false)
              loadSources()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
