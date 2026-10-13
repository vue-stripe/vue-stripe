// Redirect-based payment methods through the playground's Payment Element page, which takes a
// client secret and confirms with usePaymentIntent().confirmPayment({ return_url }). Each
// PaymentIntent allows a single method, so the Payment Element shows only that one. Stripe
// sends the browser to its "Authorize Test Payment" page and back to the playground.
import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import { elementFrame, findInFrames, setPlaygroundKey } from '../../src/stripe-ui.ts'

const METHODS = [
  { type: 'bancontact', currency: 'eur' },
  { type: 'ideal', currency: 'eur' },
  { type: 'eps', currency: 'eur' },
  { type: 'p24', currency: 'eur' },
  { type: 'alipay', currency: 'usd' },
  { type: 'klarna', currency: 'usd' },
  { type: 'affirm', currency: 'usd' },
  { type: 'afterpay_clearpay', currency: 'usd' }
] as const

test.beforeEach(async ({ page }) => {
  await setPlaygroundKey(page, config.publishableKey)
})

for (const method of METHODS) {
  test(`${method.type}: redirect, authorize the test payment, come back`, async ({
    page,
    stripe,
    snap
  }) => {
    // Affirm's minimum is $50.
    const created = await stripe.paymentIntents.create({
      amount: 5000,
      currency: method.currency,
      allowed_payment_method_types: [method.type]
    })
    await page.goto(`${config.playgroundUrl}/stripe-payment-element`)
    await page.locator('#client-secret').fill(created.client_secret ?? '')

    // Fill whatever this method asks for (name, email, bank) until Pay Now turns on.
    const frame = elementFrame(page, '.vue-stripe-payment-element')
    const payNow = page.getByRole('button', { name: 'Pay Now' })
    await expect
      .poll(
        async () => {
          const name = frame.locator('input[name="name"]')
          if ((await name.isVisible()) && !(await name.inputValue())) {
            await name.fill('Jenny Rosen')
          }
          const email = frame.locator('input[name="email"]')
          if ((await email.isVisible()) && !(await email.inputValue())) {
            await email.fill('jenny.rosen@example.com')
          }
          const bank = frame.locator('select[name="bank"]')
          if ((await bank.isVisible()) && !(await bank.inputValue())) {
            const values = await bank
              .locator('option')
              .evaluateAll((options) =>
                options.map((option) => (option as HTMLOptionElement).value)
              )
            const first = values.find(Boolean)
            if (first) await bank.selectOption(first)
          }
          return payNow.isEnabled()
        },
        { timeout: 60_000, intervals: [1_000] }
      )
      .toBe(true)
    await snap('method selected')
    await payNow.click()

    await page.waitForURL((url) => !url.href.startsWith(config.playgroundUrl), {
      timeout: 60_000
    })
    if (/klarna\.com$/.test(new URL(page.url()).hostname)) {
      await snap('klarna redirect')
      test.skip(
        true,
        "Redirected to Klarna's own sandbox login (login.playground.klarna.com), not Stripe's " +
          "Authorize Test Payment page; driving Klarna's sandbox is out of scope"
      )
    }

    const authorize = '#authorize-test-payment'
    const stripePage = await findInFrames(page, authorize, 60_000)
    await snap('authorize test payment')
    await stripePage.locator(authorize).click()

    await page.waitForURL((url) => url.href.startsWith(config.playgroundUrl), {
      timeout: 60_000
    })
    const back = new URL(page.url())
    expect(back.searchParams.get('payment_intent')).toBe(created.id)
    // Afterpay comes back without redirect_status; the API check below covers it.
    expect(back.searchParams.get('redirect_status') ?? 'succeeded').toBe('succeeded')
    await snap('back on the playground')

    const intent = await stripe.paymentIntents.retrieve(created.id, {
      expand: ['payment_method']
    })
    expect(['succeeded', 'processing']).toContain(intent.status)
    expect(typeof intent.payment_method === 'object' && intent.payment_method?.type).toBe(
      method.type
    )
  })
}
