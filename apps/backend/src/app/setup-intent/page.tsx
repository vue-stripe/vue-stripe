'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResultDisplay } from '@/components/result-display'
import { Wallet, Loader2 } from 'lucide-react'

interface SetupIntentResult {
  clientSecret: string
  setupIntentId: string
}

export default function SetupIntentPage() {
  const [customerId, setCustomerId] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<SetupIntentResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(customerId && { customerId }),
          ...(description && { description }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Setup Intent')
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vue-green">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Setup Intent</h1>
            <p className="text-sm text-muted-foreground">
              Save payment methods for future use
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Create a Setup Intent to collect and save payment method details
            without charging the customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID (optional)</Label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="cus_xxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                If provided, the payment method will be attached to this customer.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Save card for recurring payments"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Setup Intent
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6">
          <ResultDisplay
            title="Setup Intent Created"
            fields={[
              {
                label: 'Client Secret',
                value: result.clientSecret,
              },
              {
                label: 'Setup Intent ID',
                value: result.setupIntentId,
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
</VueStripeElements>

// Then confirm with useSetupIntent
const { confirmSetup } = useSetupIntent()`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
