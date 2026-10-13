import type { Page } from '@playwright/test'
import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  backendResponse,
  CARDS,
  elementFrame,
  fillPaymentElementCard,
  pickFirstProduct
} from '../../src/stripe-ui.ts'

/**
 * Fails when `upper` is not laid out above `lower` in normal flow (for example when a global
 * stylesheet positions it absolutely somewhere else on the page).
 */
async function expectAbove(page: Page, upper: string, lower: string): Promise<void> {
  const [a, b] = await Promise.all([
    page.locator(upper).boundingBox(),
    page.locator(lower).boundingBox()
  ])
  const position = await page.locator(upper).evaluate((el) => getComputedStyle(el).position)
  // Soft: the flow after it still runs and reports.
  expect
    .soft(
      { position, aboveLower: !!a && !!b && a.y + a.height <= b.y },
      `${upper} should be in normal flow above ${lower}`
    )
    .toEqual({ position: 'static', aboveLower: true })
}

test('setup-intent: saves a card with useSetupIntent', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/setup-intent`)
  const created = backendResponse<{ setupIntentId: string }>(page, '/api/setup-intent')
  await page.getByRole('button', { name: /Start/ }).click()
  const { setupIntentId } = await created

  await fillPaymentElementCard(page, CARDS.success)
  await snap('card entered')
  await page.getByRole('button', { name: 'Save card' }).click()

  await expect(page.getByRole('heading', { name: 'Card saved!' })).toBeVisible()
  await expect(page.getByText(setupIntentId)).toBeVisible()
  await snap('saved')
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  expect(setupIntent.status).toBe('succeeded')
})

test('link-authentication: email plus Payment Element pays', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/link-authentication`)
  const created = backendResponse<{ paymentIntentId: string }>(page, '/api/payment-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created
  await expect(page.locator('.ready-indicators .indicator.ready')).toHaveCount(2)

  // A fresh address has no Link account, so Link does not ask for a one-time code.
  const email = `vue-stripe-e2e+${Date.now()}@example.com`
  await elementFrame(page, '.vue-stripe-link-auth').locator('input[name="email"]').fill(email)
  await expect(page.locator('.email-detected')).toContainText(email)
  await fillPaymentElementCard(page, CARDS.success)
  await snap('email and card entered')
  await page.getByRole('button', { name: /^Pay / }).click()

  await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible()
  await snap('success')
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge']
  })
  expect(intent.status).toBe('succeeded')
})

test('address-element: a complete US address is captured', async ({ page, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/address-element`)
  await expect(page.locator('.indicator.ready')).toBeVisible()
  const frame = elementFrame(page, '.vue-stripe-address-element')

  await frame.locator('select[name="country"]').selectOption('US')
  await frame.locator('input[name="name"]').fill('Jenny Rosen')
  await frame.locator('input[name="addressLine1"]').fill('354 Oyster Point Blvd')
  // Close the autocomplete suggestions so they don't cover the next fields.
  await frame.locator('input[name="addressLine1"]').press('Escape')
  await frame.locator('input[name="locality"]').fill('South San Francisco')
  await frame.locator('select[name="administrativeArea"]').selectOption('CA')
  await frame.locator('input[name="postalCode"]').fill('94080')

  // The Shipping / Billing chips sit above the element, inside the demo card.
  await expectAbove(page, '.address-example .controls', '.address-example .stripe-container')

  const captured = page.locator('.captured')
  await expect(captured.locator('.badge')).toHaveText('complete')
  await expect(captured.locator('pre')).toContainText('"postal_code": "94080"')
  await snap('address captured')

  // Billing mode remounts the element with the other mode.
  await page.getByRole('button', { name: 'Billing' }).click()
  await expect(
    elementFrame(page, '.vue-stripe-address-element').locator('input[name="name"]')
  ).toBeVisible()
})

test('payment-method-messaging: the BNPL message renders and follows the amount', async ({
  page,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/payment-method-messaging`)
  await expect(page.locator('.indicator.ready')).toBeVisible()
  const frame = page.locator('.vue-stripe-paymentMethodMessaging-element iframe').first()
  await expect(frame).toBeVisible()
  await expect(frame.contentFrame().locator('body')).toContainText(/\S/)
  await snap('messaging')
  // Amount, currency and country controls sit above the element, inside the demo card.
  await expectAbove(page, '.bnpl-example .controls', '.bnpl-example .stripe-container')

  await page.locator('.amount-input input').fill('300')
  await expect(frame.contentFrame().locator('body')).toContainText(/\S/)
})

test('express-checkout: the element mounts and reports wallet availability', async ({
  page,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/express-checkout`)
  await pickFirstProduct(page)
  const element = page.locator('.vue-stripe-express-checkout-element')
  await expect(element.locator('.vue-stripe-element-mount')).toBeVisible({ timeout: 60_000 })
  await expect(element.locator('.vue-stripe-element-loader')).toHaveCount(0, { timeout: 60_000 })

  // Either Stripe shows at least one button, or the demo says no wallet is available here.
  const buttons = element.locator('iframe').first()
  const none = page.getByText('No express wallets are available in this browser.')
  await expect(buttons.or(none).first()).toBeVisible()
  await snap('express checkout')
  test.info().annotations.push({
    type: 'note',
    description: (await none.isVisible())
      ? 'No express wallet in this browser; the wallets project covers Link and Google Pay'
      : 'Express buttons rendered (Link, Google Pay and Apple Pay need HTTPS: see wallets)'
  })
})

test('payment-request: canMakePayment reports a result', async ({ page, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/payment-request`)
  const state = page.locator('[data-test="can-make-payment"] dd')
  await expect(state).not.toHaveText('Checking for a wallet...', { timeout: 60_000 })
  await snap('can make payment')
  test.info().annotations.push({
    type: 'note',
    description: `canMakePayment: ${(await state.textContent())?.trim()}`
  })
})
