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
import { CreditCard, Loader2 } from 'lucide-react'
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

interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export default function PaymentIntentPage() {
  const [amount, setAmount] = React.useState('1000')
  const [currency, setCurrency] = React.useState('usd')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PaymentIntentResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount, 10),
          currency,
          ...(description && { description }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Payment Intent')
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stripe-purple">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Intent</h1>
            <p className="text-sm text-muted-foreground">
              Create a Payment Intent for one-time payments
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure the payment details. The client secret can be used with
            VueStripeElements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (in cents)</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment for order #123"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Payment Intent
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6">
          <ResultDisplay
            title="Payment Intent Created"
            fields={[
              {
                label: 'Client Secret',
                value: result.clientSecret,
              },
              {
                label: 'Payment Intent ID',
                value: result.paymentIntentId,
              },
              {
                label: 'Amount',
                value: formatCurrency(result.amount, result.currency),
                copyable: false,
              },
            ]}
          />

          <Card className="mt-4 border-dashed">
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-medium">Usage Example:</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {`<VueStripeElements
  :stripe-key="publishableKey"
  :client-secret="'${result.clientSecret}'"
>
  <VueStripePaymentElement />
</VueStripeElements>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
