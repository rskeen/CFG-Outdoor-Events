"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const supabase = createClient()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile via API
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      })
    }

    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-8">
            <div className="text-4xl mb-4">📧</div>
            <h2
              className="text-2xl font-bold text-[#e8ede8] mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Check your email!
            </h2>
            <p className="text-[#8a9e8a]">
              We&apos;ve sent a confirmation link to <strong className="text-[#e8ede8]">{email}</strong>.
              Click it to activate your account.
            </p>
            <Link href="/login" className="mt-4 inline-block text-[#7cb87a] hover:underline text-sm">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold text-[#7cb87a]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            CFG OUTDOOR EVENTS
          </h1>
          <p className="text-[#8a9e8a] mt-2">Create your account</p>
        </div>

        <div className="rounded-lg border border-[#2e4530] bg-[#1a2b1c] p-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Trail Runner"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-[#8a9e8a]">At least 8 characters</p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded p-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#8a9e8a]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7cb87a] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
