import React from "react"
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@vercel/analytics/next'
import { AppShell } from '@/components/maat/AppShell'
import { NotificationsProvider } from '@/lib/notifications-store'
import { SettingsProvider } from '@/lib/settings-store'
import { OverlaysProvider } from '@/lib/overlays-store'
import './globals.css'

const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: 'MAAT',
  description: 'MAAT — Photo-to-Catalog per il resale vintage',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${_jetbrainsMono.variable}`}>
      <body className={`font-sans antialiased`}>
        <NotificationsProvider>
          <SettingsProvider>
            <OverlaysProvider>
              <AppShell>{children}</AppShell>
            </OverlaysProvider>
          </SettingsProvider>
        </NotificationsProvider>
        <Analytics />
      </body>
    </html>
  )
}
