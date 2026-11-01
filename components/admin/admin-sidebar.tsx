"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, FileText, PenSquare, FolderOpen, ImageIcon, LogOut, Menu, ChevronLeft, UserCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const links = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/posts/new", label: "Criar Post", icon: PenSquare },
  { href: "/admin/categories", label: "Categorias", icon: FolderOpen },
  { href: "/admin/media", label: "Midia", icon: ImageIcon },
  { href: "/admin/profile", label: "Perfil", icon: UserCircle },
]

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false) }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  const nav = (
    <div className="flex min-h-0 flex-col h-full">
      <div className="shrink-0 p-4 pr-16 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <span className="font-heading text-lg font-bold">
            <span className="text-primary">FG</span>{" "}
            <span className="text-foreground">Admin</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Painel administrativo" className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground truncate mb-3">{userEmail}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full rounded-md hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <Link href="/admin" className="font-heading text-lg font-bold"><span className="text-primary">FG</span> Admin</Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground" aria-label="Abrir menu administrativo">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 max-w-[calc(100vw-2rem)] h-dvh p-0 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:right-2 [&>button]:top-2">
            <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
            <SheetDescription className="sr-only">Acesse as páginas do painel.</SheetDescription>
            {nav}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-dvh w-64 shrink-0 border-r border-border bg-card">
        {nav}
      </aside>
    </>
  )
}
