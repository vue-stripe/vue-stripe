'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Loader2, RefreshCw, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface ProductPrice {
  id: string
  amount: number | null
  currency: string
  interval: string | null
  intervalCount: number | null
}

interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  type: 'one_time' | 'recurring'
  price: ProductPrice
  metadata: Record<string, string>
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }

      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const oneTimeProducts = products.filter((p) => p.type === 'one_time')
  const recurringProducts = products.filter((p) => p.type === 'recurring')

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vue-green">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-sm text-muted-foreground">
                View seeded products from your Stripe account
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loading && products.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-6">
            <div className="text-center text-destructive">
              <p className="font-medium">Failed to load products</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={fetchProducts}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No products found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create products in your{' '}
              <a
                href="https://dashboard.stripe.com/test/products"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Stripe Dashboard
              </a>{' '}
              to see them here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* One-time Products */}
      {oneTimeProducts.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-vue-stripe-yellow" />
            <h2 className="text-lg font-semibold">One-Time Products</h2>
            <Badge variant="secondary">{oneTimeProducts.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {oneTimeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Recurring Products (Subscriptions) */}
      {recurringProducts.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-stripe-purple" />
            <h2 className="text-lg font-semibold">Subscription Products</h2>
            <Badge variant="secondary">{recurringProducts.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recurringProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* API Info Card */}
      {products.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">API Endpoint</CardTitle>
            <CardDescription>
              Fetch these products programmatically using the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Endpoint
                </p>
                <code className="block rounded-md bg-muted p-3 text-sm">
                  GET /api/products
                </code>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Example Response
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(
                    {
                      products: products.slice(0, 1).map((p) => ({
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        price: p.price,
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const priceDisplay = product.price.amount
    ? formatCurrency(product.price.amount, product.price.currency)
    : 'Free'

  const intervalDisplay = product.price.interval
    ? `/${product.price.interval}`
    : ''

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{product.name}</CardTitle>
              {product.description && (
                <CardDescription className="line-clamp-1 text-xs">
                  {product.description}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge
            variant={product.type === 'recurring' ? 'default' : 'secondary'}
          >
            {product.type === 'recurring' ? 'Subscription' : 'One-time'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{priceDisplay}</span>
            <span className="text-muted-foreground">{intervalDisplay}</span>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Product ID</span>
            <code className="rounded bg-muted px-1.5 py-0.5">
              {product.id}
            </code>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price ID</span>
            <code className="rounded bg-muted px-1.5 py-0.5">
              {product.price.id}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
