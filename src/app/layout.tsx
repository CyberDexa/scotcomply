import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TRPCProvider } from '@/lib/trpc-client'
import { Toaster } from 'sonner'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ScotComply - Scottish Letting Compliance Platform',
  description: 'Comprehensive compliance tracking for Scottish letting agents and landlords',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ScotComply',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'ScotComply',
    title: 'ScotComply - Scottish Landlord Compliance',
    description: 'Complete compliance management platform for Scottish landlords',
  },
  twitter: {
    card: 'summary',
    title: 'ScotComply',
    description: 'Scottish Landlord Compliance Platform',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only sr-only-focusable fixed top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg"
        >
          Skip to main content
        </a>
        
        <TRPCProvider>
          <PWAInstallPrompt />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Toaster position="top-right" />
        </TRPCProvider>
      </body>
    </html>
  )
}
