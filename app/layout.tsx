import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration"

export const metadata: Metadata = {
  title: "CFG Outdoor Events",
  description: "Track outdoor endurance races across the Southeast US",
  manifest: "/manifest.json",
  themeColor: "#0f1710",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CFG Events",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#0f1710] text-[#e8ede8] antialiased">
        <Navbar />
        <main>{children}</main>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
