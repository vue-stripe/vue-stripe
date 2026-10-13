import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  backendResponse,
  CARDS,
  elementFrame,
  fillCardElement,
  fillPaymentElementCard,
  pickFirstProduct
} from '../../src/stripe-ui.ts'

interface IntentResponse {
  paymentIntentId: string
}

test('card-element: 4242 card pays with confirmCardPayment', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/card-element`)
  const created = backendResponse<IntentResponse>(page, '/api/payment-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created

  await fillCardElement(page, CARDS.success)
  await snap('card entered')
  await page.getByRole('button', { name: /^Pay / }).click()

  await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible()
  await snap('success')
  expect((await stripe.paymentIntents.retrieve(paymentIntentId)).status).toBe('succeeded')
})

test('split-card-elements: number, expiry and CVC pay together', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/split-card-elements`)
  const created = backendResponse<IntentResponse>(page, '/api/payment-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created

  await expect(page.locator('.ready-indicators .indicator.ready')).toHaveCount(3)
  await elementFrame(page, '.vue-stripe-cardNumber-element')
    .locator('input[name="cardnumber"]')
    .fill(CARDS.success)
  await elementFrame(page, '.vue-stripe-cardExpiry-element')
    .locator('input[name="exp-date"]')
    .fill('12 / 34')
  await elementFrame(page, '.vue-stripe-cardCvc-element').locator('input[name="cvc"]').fill('123')
  await snap('card entered')
  await page.getByRole('button', { name: /^Pay / }).click()

  await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible()
  await snap('success')
  expect((await stripe.paymentIntents.retrieve(paymentIntentId)).status).toBe('succeeded')
})

test('create-payment-method: the Card Element becomes a PaymentMethod', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/create-payment-method`)
  await fillCardElement(page, CARDS.success)
  await page.getByRole('button', { name: 'Create Payment Method' }).click()

  const result = page.locator('code.result.ok')
  await expect(result).toContainText(/pm_\w+/)
  await snap('payment method created')
  const id = /pm_\w+/.exec((await result.textContent()) ?? '')?.[0] ?? ''
  const paymentMethod = await stripe.paymentMethods.retrieve(id)
  expect(paymentMethod.card?.last4).toBe('4242')
})

test.describe('tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.docsUrl}/live-demo/tokens`)
  })

  test('ConfirmationToken from the Payment Element', async ({ page, stripe, snap }) => {
    await fillPaymentElementCard(page, CARDS.success)
    await page.locator('[data-test="create-confirmation-token"]').click()

    const result = page.locator('[data-test="confirmation-token-result"]')
    await expect(result).toContainText(/ctoken_\w+/)
    await snap('confirmation token')
    const id = (await result.locator('code').textContent())?.trim() ?? ''
    const token = await stripe.confirmationTokens.retrieve(id)
    expect(token.payment_method_preview?.type).toBe('card')
  })

  test('legacy card Token from the Card Element', async ({ page, stripe, snap }) => {
    await fillCardElement(page, CARDS.success)
    await page.locator('[data-test="create-token"]').click()

    const result = page.locator('[data-test="token-result"]')
    await expect(result).toContainText(/tok_\w+/)
    await snap('card token')
    const id = (await result.locator('code').textContent())?.trim() ?? ''
    const token = await stripe.tokens.retrieve(id)
    expect(token.card?.last4).toBe('4242')
  })

  test('Radar Session', async ({ page, snap }) => {
    await page.locator('[data-test="create-radar-session"]').click()
    await expect(page.locator('[data-test="radar-session-result"]')).toContainText(/rse_\w+/)
    await snap('radar session')
  })
})
