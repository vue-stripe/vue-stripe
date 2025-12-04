import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Wallet, ShoppingCart, ArrowRight } from 'lucide-react'

const generators = [
  {
    title: 'Payment Intent',
    description: 'Create a Payment Intent for one-time payments. Returns a client secret for use with Payment Element.',
    href: '/payment-intent',
    icon: CreditCard,
    color: 'bg-stripe-purple',
  },
  {
    title: 'Setup Intent',
    description: 'Create a Setup Intent to save payment methods for future use without charging.',
    href: '/setup-intent',
    icon: Wallet,
    color: 'bg-vue-green',
  },
  {
    title: 'Checkout Session',
    description: 'Create a Checkout Session for Stripe\'s hosted checkout page. Returns a URL and session ID.',
    href: '/checkout-session',
    icon: ShoppingCart,
    color: 'bg-vue-stripe-yellow',
  },
]

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Test Data Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Generate Stripe test data for your Vue Stripe demos. Create Payment Intents,
          Setup Intents, and Checkout Sessions, then copy the IDs to use in your app.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {generators.map((generator) => (
          <Card key={generator.href} className="group relative overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${generator.color}`}>
                <generator.icon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">{generator.title}</CardTitle>
              <CardDescription>{generator.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={generator.href}>
                  Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-dashed">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex-1">
            <h3 className="font-semibold">Need help?</h3>
            <p className="text-sm text-muted-foreground">
              Check out the Vue Stripe documentation for guides and examples.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="https://vuestripe.com" target="_blank" rel="noopener noreferrer">
              View Docs
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
