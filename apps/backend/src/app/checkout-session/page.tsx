'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResultDisplay } from '@/components/result-display'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const currencies = [
  { value: 'usd', label: 'USD - US Dollar' },
  { value: 'eur', label: 'EUR - Euro' },
  { value: 'gbp', label: 'GBP - British Pound' },
  { value: 'jpy', label: 'JPY - Japanese Yen' },
  { value: 'cad', label: 'CAD - Canadian Dollar' },
  { value: 'aud', label: 'AUD - Australian Dollar' },
  { value: 'php', label: 'PHP - Philippine Peso' },
]

const modes = [
  { value: 'payment', label: 'Payment - One-time charge' },
  { value: 'subscription', label: 'Subscription - Recurring' },
  { value: 'setup', label: 'Setup - Save payment method' },
]

interface CheckoutSessionResult {
  url: string
  sessionId: string
}

export default function CheckoutSessionPage() {
  const [productName, setProductName] = React.useState('Test Product')
  const [productDescription, setProductDescription] = React.useState('')
  const [amount, setAmount] = React.useState('1000')
  const [currency, setCurrency] = React.useState('usd')
  const [quantity, setQuantity] = React.useState('1')
  const [mode, setMode] = React.useState('payment')
  const [customerEmail, setCustomerEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<CheckoutSessionResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          ...(productDescription && { productDescription }),
          amount: parseInt(amount, 10),
          currency,
          quantity: parseInt(quantity, 10),
          mode,
          ...(customerEmail && { customerEmail }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Checkout Session')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vue-stripe-yellow">
            <ShoppingCart className="h-5 w-5 text-gray-800" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Checkout Session</h1>
            <p className="text-sm text-muted-foreground">
              Create a hosted Checkout page
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure the checkout session. You can either redirect users to the
            URL or use the session ID with VueStripeCheckout component.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Test Product"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Product Description (optional)</Label>
              <Input
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="A great product"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (cents)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                />
                <p className="text-xs text-muted-foreground">
                  {amount && formatCurrency(parseInt(amount, 10) || 0, currency)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {modes.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email (optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Checkout Session
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6">
          <ResultDisplay
            title="Checkout Session Created"
            fields={[
              {
                label: 'Checkout URL',
                value: result.url,
              },
              {
                label: 'Session ID',
                value: result.sessionId,
              },
            ]}
          />

          <div className="mt-4 flex gap-4">
            <Button asChild className="flex-1">
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                Open Checkout Page
              </a>
            </Button>
          </div>

          <Card className="mt-4 border-dashed">
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-medium">Usage with VueStripeCheckout:</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {`<VueStripeCheckout
  :stripe-key="publishableKey"
  :session-id="'${result.sessionId}'"
/>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
