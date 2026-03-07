import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parallel Me — Meet the version of yourself that chose differently',
  description:
    'Enter a life decision and explore two diverging futures. A multiverse decision engine powered by AI.',
  keywords: ['decision', 'future', 'multiverse', 'simulation', 'life choices'],
  authors: [{ name: 'Parallel Me' }],
  openGraph: {
    title: 'Parallel Me',
    description: 'Meet the version of yourself that chose differently.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF7] antialiased">{children}</body>
    </html>
  )
}
