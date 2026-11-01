"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X, Search } from "lucide-react"

const categories = [
  { name: "Destaques", slug: "trending" },
  { name: "Anime", slug: "anime" },
  { name: "Games", slug: "games" },
  { name: "Marvel", slug: "marvel" },
  { name: "DC", slug: "dc" },
  { name: "Star Wars", slug: "star-wars" },
  { name: "RPG", slug: "rpg" },
  { name: "Tecnologia", slug: "tech" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false) }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight text-primary">
            Fronteira
          </span>
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            Geek
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/search"
            className="flex min-h-11 min-w-11 items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="lg:hidden flex min-h-11 min-w-11 items-center justify-center p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Alternar navegacao"
            aria-expanded={mobileOpen}
            aria-controls="mobile-site-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-site-navigation" className="lg:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex min-h-11 items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
