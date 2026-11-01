import React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <AdminSidebar userEmail={session.email} userRole={session.role} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
