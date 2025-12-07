'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CreditCard,
  Settings,
  ShoppingCart,
  Wallet,
  ExternalLink,
  Landmark,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const generators = [
  {
    name: 'Payment Intent',
    href: '/payment-intent',
    icon: CreditCard,
    description: 'One-time payments',
  },
  {
    name: 'Setup Intent',
    href: '/setup-intent',
    icon: Wallet,
    description: 'Save payment methods',
  },
  {
    name: 'Checkout Session',
    href: '/checkout-session',
    icon: ShoppingCart,
    description: 'Hosted checkout',
  },
]

const catalog = [
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    description: 'View seeded products',
  },
]

const euPayments = [
  {
    name: 'iDEAL (Netherlands)',
    href: '/ideal-intent',
    icon: Landmark,
    description: 'Dutch bank payments',
  },
  {
    name: 'EPS (Austria)',
    href: '/eps-intent',
    icon: Landmark,
    description: 'Austrian bank payments',
  },
  {
    name: 'P24 (Poland)',
    href: '/p24-intent',
    icon: Landmark,
    description: 'Polish bank payments',
  },
  {
    name: 'SEPA Debit',
    href: '/sepa-debit-intent',
    icon: Landmark,
    description: 'EU IBAN payments',
  },
]

const externalLinks = [
  {
    name: 'Vue Stripe Docs',
    href: 'https://vuestripe.com',
    icon: ExternalLink,
  },
  {
    name: 'Stripe Dashboard',
    href: 'https://dashboard.stripe.com/test',
    icon: ExternalLink,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stripe-purple">
          <Settings className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="font-semibold">Vue Stripe</h1>
          <p className="text-xs text-muted-foreground">Test Data Generator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generators
        </p>
        {generators.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <div>
                <p className="font-medium">{item.name}</p>
                {!isActive && (
                  <p className="text-xs opacity-70">{item.description}</p>
                )}
              </div>
            </Link>
          )
        })}

        <p className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Catalog
        </p>
        {catalog.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <div>
                <p className="font-medium">{item.name}</p>
                {!isActive && (
                  <p className="text-xs opacity-70">{item.description}</p>
                )}
              </div>
            </Link>
          )
        })}

        <p className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          EU Payments
        </p>
        {euPayments.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <div>
                <p className="font-medium">{item.name}</p>
                {!isActive && (
                  <p className="text-xs opacity-70">{item.description}</p>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* External Links */}
      <div className="p-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resources
        </p>
        {externalLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </a>
        ))}
      </div>
    </aside>
  )
}
