import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  answer3DS,
  backendResponse,
  CARDS,
  fillPaymentElementCard,
  pickFirstProduct
} from '../../src/stripe-ui.ts'

interface IntentResponse {
  clientSecret: string
  paymentIntentId: string
}

test.describe('payment-element', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.docsUrl}/live-demo/payment-element`)
  })

  async function startPayment(page: import('@playwright/test').Page): Promise<IntentResponse> {
    const intent = backendResponse<IntentResponse>(page, '/api/payment-intent')
    await pickFirstProduct(page)
    const created = await intent
    // Both ready indicators (Elements, Payment) turn on once Stripe has mounted.
    await expect(page.locator('.ready-indicators .indicator.ready')).toHaveCount(2)
    return created
  }

  test('4242 card succeeds', async ({ page, stripe, snap }) => {
    const { paymentIntentId } = await startPayment(page)
    await fillPaymentElementCard(page, CARDS.success)
    await snap('card entered')
    await page.getByRole('button', { name: /^Pay / }).click()

    await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible()
    await expect(page.getByText(paymentIntentId)).toBeVisible()
    await snap('success')
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    expect(intent.status).toBe('succeeded')
  })

  test('3D Secure card succeeds after Complete', async ({ page, stripe, snap }) => {
    const { paymentIntentId } = await startPayment(page)
    await fillPaymentElementCard(page, CARDS.threeDS)
    await page.getByRole('button', { name: /^Pay / }).click()

    await answer3DS(page, 'complete')
    await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible()
    await snap('success after 3ds')
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    expect(intent.status).toBe('succeeded')
  })

  test('declined card shows the decline', async ({ page, stripe, snap }) => {
    const { paymentIntentId } = await startPayment(page)
    await fillPaymentElementCard(page, CARDS.declined)
    await page.getByRole('button', { name: /^Pay / }).click()

    await expect(page.locator('.error-box')).toContainText(/declined/i)
    await snap('declined')
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    expect(intent.status).toBe('requires_payment_method')
    expect(intent.last_payment_error?.code).toBe('card_declined')
  })
})
