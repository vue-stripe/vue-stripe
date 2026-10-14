const never = () => new Promise<string>(() => {})

/**
 * The client secret to hand `initCheckoutElementsSdk()` / `initCheckoutFormSdk()`, from the
 * `fetchClientSecret` or else the `clientSecret` prop. Stripe.js checks a secret Promise in a
 * chain of its own that nothing handles, so a rejected one, or one resolving to anything but a
 * non-empty string, ended up uncaught even with `loadActions()` handled (#697). The failure
 * goes to `fail` instead, worded as in VueStripeEmbeddedCheckout, and Stripe gets a Promise that
 * never settles.
 */
export function checkedSecret(
  props: {
    clientSecret?: string | Promise<string> | undefined
    fetchClientSecret?: (() => Promise<string>) | undefined
  },
  fail: (message: string) => void
): string | Promise<string> {
  const prop = props.fetchClientSecret ? 'fetchClientSecret' : 'clientSecret'
  const source = props.fetchClientSecret ? props.fetchClientSecret() : props.clientSecret
  if (source && typeof source == 'string') return source
  return Promise.resolve(source).then(
    (secret: unknown) =>
      secret && typeof secret == 'string'
        ? secret
        : (fail(`${prop} did not resolve to a client secret`), never()),
    (err: unknown) => (fail(err instanceof Error ? err.message : String(err)), never())
  )
}
