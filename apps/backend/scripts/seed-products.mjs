// Seeds a Stripe test-mode account with the demo catalog the docs and playground use
// (the "Select a product" step of the live demos lists these products).
//
//   STRIPE_SECRET_KEY=sk_test_... pnpm --filter @vue-stripe/backend seed:products
//
// Idempotent: each product carries metadata.vue_stripe_seed = <key>, and existing seeded
// products are left as they are. Refuses to run with a live-mode key.
import { readFileSync } from 'node:fs'
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Set STRIPE_SECRET_KEY to a test-mode secret key (sk_test_...).')
  process.exit(1)
}
if (!key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
  console.error('Refusing to seed with a live-mode key. Use a test-mode key (sk_test_...).')
  process.exit(1)
}

// A CLI: progress goes to stdout (the repo's lint rules keep console.log out of app code).
const say = (line) => process.stdout.write(`${line}\n`)

const stripe = new Stripe(key)
const catalog = JSON.parse(readFileSync(new URL('./demo-catalog.json', import.meta.url), 'utf8'))

const seeded = new Map()
for await (const product of stripe.products.list({ limit: 100 })) {
  const tag = product.metadata?.vue_stripe_seed
  if (tag) seeded.set(tag, product)
}

let created = 0
for (const item of catalog) {
  if (seeded.has(item.key)) {
    say(`exists   ${item.name}`)
    continue
  }
  await stripe.products.create({
    name: item.name,
    description: item.description,
    images: item.images,
    metadata: { vue_stripe_seed: item.key },
    default_price_data: {
      currency: item.currency,
      unit_amount: item.amount,
      ...(item.interval ? { recurring: { interval: item.interval } } : {})
    }
  })
  created++
  say(`created  ${item.name}`)
}
say(`${created} created, ${catalog.length - created} already present`)
