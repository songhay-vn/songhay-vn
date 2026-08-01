"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

const AdminSidebarContext = createContext({
  isCollapsed: false,
  toggleCollapse: () => {},
})

export function useAdminSidebar() {
  return useContext(AdminSidebarContext)
}

export function AdminSidebarLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
      const saved = localStorage.getItem("admin-sidebar-collapsed")
      if (saved) {
        setIsCollapsed(saved === "true")
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])
  
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem("admin-sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <AdminSidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      <div 
        data-collapsed={mounted && isCollapsed ? "true" : undefined}
        className="group/sidebar grid min-h-[calc(100dvh-5rem)] w-full transition-[grid-template-columns] duration-300 md:grid-cols-[288px_minmax(0,1fr)] data-[collapsed=true]:md:grid-cols-[80px_minmax(0,1fr)]"
      >
        <aside className="relative flex flex-col border-b border-zinc-200 bg-white md:border-r md:border-b-0">
          <div className="flex h-12 shrink-0 items-center justify-end border-b border-zinc-100 px-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapse} 
              className="size-8 text-zinc-500 hover:text-zinc-900" 
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebar}
          </div>
        </aside>
        <section className="min-w-0 space-y-4 p-4 md:p-6 xl:p-8">
          {children}
        </section>
      </div>
    </AdminSidebarContext.Provider>
  )
}
