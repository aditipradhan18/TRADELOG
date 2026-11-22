import './globals.css'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'TradeLog', description: 'A private trading journal' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
