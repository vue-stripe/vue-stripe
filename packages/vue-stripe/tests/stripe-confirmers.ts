import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The method-specific confirmers (`confirm<Method>Payment` / `confirm<Method>Setup`)
 * declared on the `Stripe` interface of the installed `@stripe/stripe-js`. Read from
 * the `.d.ts` so a confirmer Stripe ships later fails the confirm tests until it gets
 * a composable. `confirmPayment` / `confirmSetup` do not match (no method infix);
 * they are wrapped by `usePaymentIntent` / `useSetupIntent`.
 */
const here = dirname(fileURLToPath(import.meta.url))
const STRIPE_DTS = resolve(here, '../node_modules/@stripe/stripe-js/dist/stripe-js/stripe.d.ts')

export const STRIPE_CONFIRMERS: string[] = [
  ...new Set(
    [
      ...readFileSync(STRIPE_DTS, 'utf8').matchAll(/^\s+(confirm[A-Z]\w*(?:Payment|Setup))\(/gm)
    ].map((m) => m[1] as string)
  )
].sort()

/** `confirmCardPayment` -> `useConfirmCardPayment` */
export const composableName = (method: string) =>
  `use${method.charAt(0).toUpperCase()}${method.slice(1)}`
