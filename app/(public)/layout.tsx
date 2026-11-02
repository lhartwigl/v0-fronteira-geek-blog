import { TrackTraffic } from '@/components/track-traffic'
import React from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrackTraffic />
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  )
}
