"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface RegisterButtonProps {
  raceId: string
  initiallyRegistered: boolean
  initialCount: number
  currentUserId?: string
}

export function RegisterButton({
  raceId,
  initiallyRegistered,
  initialCount,
  currentUserId,
}: RegisterButtonProps) {
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(initiallyRegistered)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!currentUserId) {
      router.push(`/login?next=/race/${raceId}`)
      return
    }

    const method = isRegistered ? "DELETE" : "POST"
    const prevRegistered = isRegistered
    const prevCount = count

    // Optimistic update
    setIsRegistered(!isRegistered)
    setCount((c) => (isRegistered ? c - 1 : c + 1))
    setLoading(true)

    try {
      const res = await fetch(`/api/races/${raceId}/register`, { method })
      if (!res.ok) {
        setIsRegistered(prevRegistered)
        setCount(prevCount)
      } else {
        const data = (await res.json()) as { registered: boolean; count: number }
        setIsRegistered(data.registered)
        setCount(data.count)
        router.refresh()
      }
    } catch {
      setIsRegistered(prevRegistered)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={isRegistered ? "default" : "outline"}
        className="w-full text-base"
        onClick={handleClick}
        disabled={loading}
      >
        {isRegistered ? "✓ I'm In!" : "I'm In"}
      </Button>
      {isRegistered && (
        <button
          onClick={handleClick}
          disabled={loading}
          className="text-xs text-[#8a9e8a] hover:text-[#e8ede8] w-full text-center underline"
        >
          Remove my registration
        </button>
      )}
      <p className="text-xs text-center text-[#8a9e8a]">
        {count} CFG member{count !== 1 ? "s" : ""} registered
      </p>
    </div>
  )
}
