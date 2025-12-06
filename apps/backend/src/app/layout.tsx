import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vue Stripe Test Data Generator',
  description: 'Generate test data for Vue Stripe demos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-16 items-center justify-end border-b px-6">
              <ThemeToggle />
            </header>
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
