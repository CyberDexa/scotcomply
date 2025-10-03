'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { PreferencesProvider } from '@/contexts/PreferencesContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <SessionProvider>
      <PreferencesProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            mobileOpen={mobileMenuOpen} 
            onMobileClose={() => setMobileMenuOpen(false)} 
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </PreferencesProvider>
    </SessionProvider>
  )
}
