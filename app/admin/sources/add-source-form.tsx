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
import { Switch } from "@/components/ui/switch"

interface AddSourceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddSourceForm({ onSuccess, onCancel }: AddSourceFormProps) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [raceType, setRaceType] = useState("")
  const [renderMethod, setRenderMethod] = useState<"static" | "playwright">("static")
  const [geoFilter, setGeoFilter] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [config, setConfig] = useState<object | null>(null)
  const [configJson, setConfigJson] = useState("")

  const handleAnalyze = async () => {
    if (!url) return
    setAnalyzing(true)
    setAnalyzeError(null)

    const res = await fetch("/api/admin/sources/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    setAnalyzing(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setAnalyzeError(data.error ?? "Analysis failed")
      return
    }

    const data = (await res.json()) as { config: object }
    setConfig(data.config)
    setConfigJson(JSON.stringify(data.config, null, 2))
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    let fieldMap: Record<string, string> | null = null
    if (configJson.trim()) {
      try {
        fieldMap = JSON.parse(configJson) as Record<string, string>
      } catch {
        setError("Invalid JSON configuration")
        setSaving(false)
        return
      }
    }

    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || new URL(url).hostname,
        url,
        race_type: raceType || null,
        render_method: renderMethod,
        field_map: fieldMap,
        geo_filter: geoFilter,
        active: true,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Failed to save")
      return
    }

    onSuccess()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-gray-700">Source URL *</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/races"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white border-gray-300 text-gray-900 flex-1"
          />
          <Button
            onClick={handleAnalyze}
            disabled={!url || analyzing}
            className="bg-green-700 hover:bg-green-800 text-white whitespace-nowrap"
          >
            {analyzing ? "Analyzing..." : "Analyze with Claude"}
          </Button>
        </div>
        {analyzeError && (
          <p className="text-sm text-red-600">{analyzeError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-gray-700">Source Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UltraSignup Southeast"
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-gray-700">Race Type Filter</Label>
          <Select value={raceType} onValueChange={setRaceType}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any type</SelectItem>
              {["trail", "ultra", "ocr", "adventure", "orienteering", "mtb", "gravel", "other"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-gray-700">Render Method</Label>
          <Select
            value={renderMethod}
            onValueChange={(v) => setRenderMethod(v as "static" | "playwright")}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static (BeautifulSoup)</SelectItem>
              <SelectItem value="playwright">Playwright (JS rendering)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-gray-700">Geo Filter (500mi from Woodstock)</Label>
          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={geoFilter}
              onCheckedChange={setGeoFilter}
            />
            <span className="text-sm text-gray-600">{geoFilter ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </div>

      {config !== null && (
        <div className="space-y-1">
          <Label className="text-gray-700">Claude Analysis Result (editable JSON)</Label>
          <Textarea
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            rows={10}
            className="bg-white border-gray-300 text-gray-900 font-mono text-xs"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!url || saving}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          {saving ? "Saving..." : "Save Source"}
        </Button>
      </div>
    </div>
  )
}
