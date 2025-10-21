import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'MSPro Escrow - Платформа безопасных сделок',
  description: 'Безопасная платформа для проведения эскроу-сделок с гарантией защиты средств',
  keywords: ['escrow', 'безопасные сделки', 'эскроу', 'MSPro'],
  authors: [{ name: 'MSPro Ltd' }],
  openGraph: {
    title: 'MSPro Escrow',
    description: 'Платформа безопасных сделок',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
