import React from "react"
import type { Metadata } from 'next'
import { Manrope, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppShell } from '@/components/maat/AppShell'
import { NotificationsProvider } from '@/lib/notifications-store'
import { SettingsProvider } from '@/lib/settings-store'
import { OverlaysProvider } from '@/lib/overlays-store'
import { RefreshProvider } from '@/lib/refresh-store'
import './globals.css'

// PT Root UI è a pagamento (ParaType, licenza Adobe Fonts): non scaricabile qui.
// Manrope è l'alternativa gratuita più vicina — stessa famiglia geometrica dal
// tratto amichevole, gamma di pesi 200–800 sufficiente per non dover forzare
// nessun peso finto (Tailwind font-bold/font-semibold restano 700/600 validi).
const _manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// Source Sans Pro: Google l'ha rinominato "Source Sans 3", è lo stesso disegno.
// Copre il ruolo prima di JetBrains Mono — numeri, SKU, badge, timestamp — ma
// non è un monospace: l'allineamento delle cifre nelle tabelle si affida a
// `tabular-nums`, non più alla larghezza fissa dei caratteri.
const _sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });

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
    <html lang="it" className={`${_manrope.variable} ${_sourceSans.variable}`}>
      <body className={`font-sans antialiased`}>
        <NotificationsProvider>
          <SettingsProvider>
            <OverlaysProvider>
              <RefreshProvider>
                <AppShell>{children}</AppShell>
              </RefreshProvider>
            </OverlaysProvider>
          </SettingsProvider>
        </NotificationsProvider>
        <Analytics />
      </body>
    </html>
  )
}
