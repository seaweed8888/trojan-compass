import type { Metadata, Viewport } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import './globals.css'

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans', display: 'swap' })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', weight: ['600', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Trojan Compass · USC Campus Maps',
  description: 'Explore USC classrooms, events, and demo routes in 3D floor plans.',
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { title: 'Trojan Compass' },
}

export const viewport: Viewport = { themeColor: '#990000' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      {/* Grammarly adds body attributes before hydration; keep descendant checks active. */}
      <body suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
        {children}
      </body>
    </html>
  )
}
