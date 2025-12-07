import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  try {
    const stripe = getStripe()

    // Fetch all active products with their default prices expanded
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // Fetch all active prices to get complete price information
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    })

    // Build a map of product ID to prices for quick lookup
    const pricesByProduct = new Map<string, typeof prices.data>()
    for (const price of prices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id
      const existing = pricesByProduct.get(productId) || []
      existing.push(price)
      pricesByProduct.set(productId, existing)
    }

    // Format products with their prices
    const formatted = products.data
      .map((product) => {
        // Get the default price or the first available price
        const defaultPrice = product.default_price
        const productPrices = pricesByProduct.get(product.id) || []

        // Use default_price if available and it's a Price object, otherwise use first price
        let price = null
        if (defaultPrice && typeof defaultPrice !== 'string') {
          price = defaultPrice
        } else if (productPrices.length > 0) {
          price = productPrices[0]
        }

        if (!price) {
          return null
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          type: price.recurring ? 'recurring' : 'one_time',
          price: {
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval || null,
            intervalCount: price.recurring?.interval_count || null,
          },
          metadata: product.metadata,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    return NextResponse.json({ products: formatted })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
