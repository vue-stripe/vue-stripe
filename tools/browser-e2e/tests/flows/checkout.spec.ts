import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  backendResponse,
  CARDS,
  elementFrame,
  fillPaymentElementCard,
  payOnCheckoutPage,
  pickFirstProduct
} from '../../src/stripe-ui.ts'

interface SessionResponse {
  url: string | null
  sessionId: string
  clientSecret: string | null
}

const email = (): string => `vue-stripe-e2e+${Date.now()}@example.com`

test.describe('checkout-redirect', () => {
  for (const approach of ['VueStripeCheckout Component', 'Direct URL Redirect'] as const) {
    test(`${approach}: pays on checkout.stripe.com and comes back`, async ({
      page,
      stripe,
      snap
    }) => {
      await page.goto(`${config.docsUrl}/live-demo/checkout-redirect`)
      await pickFirstProduct(page)
      await page.getByRole('button', { name: approach }).click()

      const created = backendResponse<SessionResponse>(page, '/api/checkout-session')
      if (approach === 'VueStripeCheckout Component') {
        await page.getByRole('button', { name: 'Create Checkout Session' }).click()
        await expect(page.locator('.session-info')).toContainText('Session created')
      }
      await page.getByRole('button', { name: 'Pay with Stripe Checkout' }).click()
      const { sessionId } = await created

      await page.waitForURL(/checkout\.stripe\.com/)
      await payOnCheckoutPage(page, email())
      await snap('hosted checkout filled')

      await page.waitForURL((url) => url.href.startsWith(config.docsUrl), { timeout: 90_000 })
      await expect(page.locator('.payment-status')).toContainText('Payment successful!')
      await snap('back on the docs')
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      expect(session.status).toBe('complete')
      expect(session.payment_status).toBe('paid')
    })
  }
})

test('embedded-checkout: pays inside the embedded page', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/embedded-checkout`)
  const created = backendResponse<SessionResponse>(page, '/api/checkout-session')
  await pickFirstProduct(page)
  const { sessionId } = await created

  const frame = page.locator('.vue-stripe-embedded-checkout-mount iframe').first().contentFrame()
  await payOnCheckoutPage(frame, email())
  await snap('embedded checkout filled')

  // Stripe redirects to the return URL, where the demo reads ?session_id.
  await expect(page.getByRole('heading', { name: 'Checkout Complete' })).toBeVisible({
    timeout: 90_000
  })
  await expect(page.getByText(sessionId)).toBeVisible()
  await snap('complete')
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  expect(session.payment_status).toBe('paid')
})

test('custom-checkout: Payment and Address Elements on a Checkout Session', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/custom-checkout`)
  const created = backendResponse<SessionResponse>(page, '/api/checkout-session')
  await pickFirstProduct(page)
  const { sessionId } = await created

  await page.locator('.checkout-form input[type="email"]').fill(email())
  await fillPaymentElementCard(page, CARDS.success)
  const address = elementFrame(page, '.vue-stripe-address-element')
  await address.locator('select[name="country"]').selectOption('US')
  await address.locator('input[name="name"]').fill('Jenny Rosen')
  await address.locator('input[name="addressLine1"]').fill('354 Oyster Point Blvd')
  await address.locator('input[name="addressLine1"]').press('Escape')
  await address.locator('input[name="locality"]').fill('South San Francisco')
  await address.locator('select[name="administrativeArea"]').selectOption('CA')
  await address.locator('input[name="postalCode"]').fill('94080')
  await snap('form filled')
  await page.locator('[data-test="pay"]').click()

  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible({
    timeout: 90_000
  })
  await expect(page.getByText(sessionId)).toBeVisible()
  await snap('success')
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  expect(session.payment_status).toBe('paid')
})

test('checkout-form: the Checkout Form element pays (Stripe beta)', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/checkout-form`)
  const created = backendResponse<SessionResponse>(page, '/api/checkout-session')
  await pickFirstProduct(page)
  const { sessionId } = await created

  const providerError = page.locator('.checkout-form-example .error-box')
  const form = elementFrame(page, '.vue-stripe-checkout-form')
  await expect(form.locator('input[name="email"]').or(providerError).first()).toBeVisible({
    timeout: 60_000
  })
  if (await providerError.isVisible()) {
    test.skip(true, `No Checkout Form beta on this account: ${await providerError.textContent()}`)
  }

  await form.locator('input[name="email"]').fill(email())
  await form.locator('input[name="number"]').fill(CARDS.success)
  await form.locator('input[name="expiry"]').fill('12 / 34')
  await form.locator('input[name="cvc"]').fill('123')
  const country = form.locator('select[name="country"]')
  if (await country.isVisible()) await country.selectOption('US')
  const postal = form.locator('input[name="postalCode"]')
  if (await postal.isVisible()) await postal.fill('10001')
  await expect(page.locator('[data-test="form-complete"]')).toHaveText('Yes')
  await snap('form filled')
  await form.locator('[data-testid="payment-form-submit-button"]').click()

  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible({
    timeout: 90_000
  })
  await snap('success')
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  expect(session.payment_status).toBe('paid')
})

test('subscription-checkout: subscribes on checkout.stripe.com', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/subscription-checkout`)
  await pickFirstProduct(page)
  const created = backendResponse<SessionResponse>(page, '/api/checkout-session')
  await page.getByRole('button', { name: 'Subscribe with Stripe Checkout' }).click()
  const { sessionId } = await created

  await page.waitForURL(/checkout\.stripe\.com/)
  await payOnCheckoutPage(page, email())
  await snap('hosted checkout filled')

  await page.waitForURL((url) => url.href.startsWith(config.docsUrl), { timeout: 90_000 })
  await expect(page.locator('.payment-status')).toContainText('Payment successful!')
  await snap('back on the docs')
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  })
  expect(session.status).toBe('complete')
  const subscription = session.subscription
  expect(typeof subscription === 'object' && subscription?.status).toBe('active')
})

test('subscription-embedded: subscribes with the Payment Element', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/subscription-embedded`)
  await pickFirstProduct(page)
  await page.locator('#customer-email').fill(email())
  const created = backendResponse<{ subscriptionId: string }>(page, '/api/subscription')
  await page.getByRole('button', { name: 'Continue to Payment' }).click()
  const { subscriptionId } = await created

  await fillPaymentElementCard(page, CARDS.success)
  await snap('card entered')
  await page.getByRole('button', { name: 'Start Subscription' }).click()

  await expect(page.getByRole('heading', { name: 'Subscription Active!' })).toBeVisible()
  await expect(page.getByText(subscriptionId)).toBeVisible()
  await snap('active')
  // The first invoice is paid synchronously with the card; the subscription turns active.
  await expect
    .poll(async () => (await stripe.subscriptions.retrieve(subscriptionId)).status, {
      timeout: 30_000
    })
    .toBe('active')
})
