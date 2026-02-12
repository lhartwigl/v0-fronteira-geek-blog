"use client"

import { useEffect, useRef } from "react"

export function TrackClick({ postId }: { postId: number }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    fetch(`/api/posts/${postId}/click`, { method: "POST" }).catch(() => {})
  }, [postId])

  return null
}
