export interface Profile {
  id: string
  display_name: string
  role: "user" | "admin"
  created_at: string
}

export interface Race {
  id: string
  name: string
  race_type:
    | "trail"
    | "ultra"
    | "ocr"
    | "adventure"
    | "orienteering"
    | "mtb"
    | "gravel"
    | "other"
    | null
  date: string
  end_date: string | null
  location_name: string | null
  location_city: string | null
  location_state: string | null
  lat: number | null
  lng: number | null
  distance_miles_from_woodstock: number | null
  description: string | null
  registration_url: string | null
  race_url: string | null
  cost_min: number | null
  cost_max: number | null
  is_active: boolean
  source_id: string | null
  manually_added: boolean
  added_by: string | null
  created_at: string
  updated_at: string
  // joined
  registration_count?: number
  user_registered?: boolean
}

export interface Registration {
  id: string
  race_id: string
  user_id: string
  created_at: string
}

export interface ScraperSource {
  id: string
  name: string
  url: string
  race_type: string | null
  render_method: "static" | "playwright" | null
  field_map: Record<string, string> | null
  geo_filter: boolean
  active: boolean
  last_run_at: string | null
  last_error: string | null
  created_at: string
}

export interface GroupmePost {
  id: string
  race_id: string | null
  trigger_type: "new_race" | "registration" | "4_month" | "2_month" | "1_month"
  message: string
  sent_at: string
}
