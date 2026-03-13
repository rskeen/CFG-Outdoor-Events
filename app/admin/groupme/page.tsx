"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import type { GroupmePost, Race } from "@/lib/types"
import { Send, CheckCircle, AlertCircle } from "lucide-react"

interface UpcomingReminderRace {
  race: Race
  registrationCount: number
  daysUntil: number
  monthsUntil: number
}

export default function AdminGroupmePage() {
  const [sentPosts, setSentPosts] = useState<GroupmePost[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminderRace[]>([])
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const loadData = async () => {
    setLoading(true)

    // Load sent posts
    const postsRes = await fetch("/api/admin/groupme/posts")
    if (postsRes.ok) {
      const data = (await postsRes.json()) as GroupmePost[]
      setSentPosts(data)
    }

    // Load upcoming reminders
    const remindersRes = await fetch("/api/admin/groupme/upcoming")
    if (remindersRes.ok) {
      const data = (await remindersRes.json()) as UpcomingReminderRace[]
      setUpcomingReminders(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSendTest = async () => {
    setSending(true)
    setSendResult(null)

    const res = await fetch("/api/admin/groupme/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMessage || undefined }),
    })

    setSending(false)

    if (res.ok) {
      const data = (await res.json()) as { message: string }
      setSendResult({ success: true, message: data.message })
      loadData()
    } else {
      const data = (await res.json()) as { error?: string }
      setSendResult({ success: false, message: data.error ?? "Failed" })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GroupMe</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage automated GroupMe notifications
        </p>
      </div>

      {/* Test message */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Send Test Message
        </h2>
        <div className="space-y-3">
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Leave empty for default test message..."
            rows={3}
            className="bg-white border-gray-300 text-gray-900"
          />
          <Button
            onClick={handleSendTest}
            disabled={sending}
            className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send to GroupMe"}
          </Button>
          {sendResult && (
            <div
              className={`flex items-center gap-2 text-sm p-3 rounded ${
                sendResult.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {sendResult.success
                ? `Sent: "${sendResult.message}"`
                : `Error: ${sendResult.message}`}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming scheduled reminders */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Upcoming Scheduled Reminders
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : upcomingReminders.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No races with registrations at 1, 2, or 4 month milestones.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingReminders.map(({ race, registrationCount, monthsUntil }) => (
              <div
                key={race.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-900">{race.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatDate(race.date)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {monthsUntil}mo · {registrationCount} registered
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent posts log */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Message History ({sentPosts.length})
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : sentPosts.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages sent yet.</p>
        ) : (
          <div className="space-y-3">
            {sentPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-100 rounded p-3 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {post.trigger_type}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(post.sent_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{post.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
