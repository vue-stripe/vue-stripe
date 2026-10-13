import type { Locator, Page } from '@playwright/test'
import Stripe from 'stripe'
import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  backendResponse,
  elementFrame,
  pickFirstProduct,
  setPlaygroundKey,
  waitForFrame
} from '../../src/stripe-ui.ts'

interface IntentResponse {
  paymentIntentId: string
}

test('iban-element: SEPA Direct Debit confirms to processing', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/iban-element`)
  const created = backendResponse<IntentResponse>(page, '/api/sepa-debit-intent')
  await page.getByRole('button', { name: /Start/ }).click()
  const { paymentIntentId } = await created

  await page.getByPlaceholder('Full name').fill('Jenny Rosen')
  await page.getByPlaceholder('Email').fill('jenny.rosen@example.com')
  // DE89 3704 0044 0532 0130 00: processing, then succeeded (guide/testing).
  await elementFrame(page, '.vue-stripe-iban-element')
    .locator('input[name="iban"]')
    .fill('DE89370400440532013000')
  await snap('iban entered')
  await page.getByRole('button', { name: /with SEPA$/ }).click()

  await expect(page.getByRole('heading', { name: 'Debit submitted!' })).toBeVisible()
  await snap('submitted')
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  expect(['processing', 'succeeded']).toContain(intent.status)
})

test.describe('ach-debit', () => {
  test('Financial Connections test institution, then confirm', async ({ page, stripe, snap }) => {
    await page.goto(`${config.docsUrl}/live-demo/ach-debit`)
    const created = backendResponse<IntentResponse>(page, '/api/ach-debit-intent')
    await pickFirstProduct(page)
    const { paymentIntentId } = await created

    await page.locator('[data-test="ach-link"]').click()
    const modal = await waitForFrame(page, 'linked-accounts-inner')
    // Test (Non-OAuth) bank, accept the terms, choose the Success account (guide/testing).
    await modal.locator('[data-testid="institution-default"]').click()
    await modal.locator('[data-testid="agree-button"]').click()
    await modal
      .locator('[data-testid="account-picker-item"]')
      .filter({ hasText: /^Success/ })
      .filter({ hasNotText: 'Disputed' })
      .click({ timeout: 60_000 })
    await snap('account selected')
    await modal.locator('[data-testid="select-button"]').click()

    // Stripe may offer to save the account to Link, then may show a success screen.
    const linked = page.locator('[data-test="ach-linked"]')
    const notNow = modal.locator('[data-testid="link-not-now-button"]')
    const done = modal.locator('[data-testid="done-button"]')
    await expect
      .poll(
        async () => {
          if (await linked.isVisible()) return 'linked'
          // The modal's frame detaches when it closes.
          const visible = (locator: Locator): Promise<boolean> =>
            locator.isVisible().catch(() => false)
          if (await visible(notNow)) await notNow.click().catch(() => undefined)
          else if (await visible(done)) await done.click().catch(() => undefined)
          return 'in the modal'
        },
        { timeout: 90_000, intervals: [1_000] }
      )
      .toBe('linked')
    await expect(linked).toBeVisible({ timeout: 60_000 })
    await snap('bank linked')
    await page.locator('[data-test="ach-confirm"]').click()

    await expect(page.getByRole('heading', { name: 'Payment Submitted' })).toBeVisible()
    await snap('submitted')
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    expect(['processing', 'succeeded']).toContain(intent.status)
  })

  test('manual entry with micro-deposits', () => {
    test.skip(
      true,
      "Not reachable from the demo: apps/backend's /api/ach-debit-intent sets " +
        "verification_method: 'instant', so the Financial Connections modal offers no manual " +
        'entry. Allowing microdeposits there would make this path testable.'
    )
  })
})

test('becs-payment: the docs demo against the docs account', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/becs-payment`)
  await expect(page.locator('.account-note')).toContainText('Requires an Australian Stripe account')

  const account = await stripe.accounts.retrieveCurrent()
  if (account.country !== 'AU') {
    // What the demo promises on a non-AU account: Stripe rejects the PaymentIntent and the
    // demo shows the error. The AU flow itself runs in the next test, on the AU keys.
    await pickFirstProduct(page)
    await expect(page.locator('.error-box')).toContainText(
      /au_becs_debit|allowed_payment_method_types/i
    )
    await snap('non-au account error')
    test.info().annotations.push({
      type: 'note',
      description: `${account.country} account: Stripe rejects au_becs_debit and the demo says so`
    })
    return
  }

  const created = backendResponse<IntentResponse>(page, '/api/becs-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created
  await page.locator('#name').fill('Jenny Rosen')
  await page.locator('#email').fill('jenny.rosen@example.com')
  await fillAuBankAccount(page)
  await page.locator('.mandate-checkbox input').check()
  await snap('bank entered')
  await page.getByRole('button', { name: /^Pay|Confirm/ }).click()

  await expect(page.locator('.success-state, .success')).toBeVisible()
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  expect(['processing', 'succeeded']).toContain(intent.status)
})

test('becs on an AU account: AU Bank Account Element and useConfirmAuBecsDebitPayment', async ({
  page,
  snap
}) => {
  test.skip(
    !config.auSecretKey || !config.auPublishableKey,
    'Set STRIPE_AU_SECRET_KEY and STRIPE_AU_PUBLISHABLE_KEY (an Australian test account)'
  )
  // The docs demo is tied to the docs account, so this drives the playground's AU Bank Account
  // page with the AU publishable key and a PaymentIntent created on the AU account.
  const au = new Stripe(config.auSecretKey, { maxNetworkRetries: 2 })
  const created = await au.paymentIntents.create({
    amount: 1000,
    currency: 'aud',
    allowed_payment_method_types: ['au_becs_debit']
  })
  await setPlaygroundKey(page, config.auPublishableKey)
  await page.goto(`${config.playgroundUrl}/stripe-au-bank-account-element`)
  await page.getByPlaceholder(/^pi_xxx_secret_xxx/).fill(created.client_secret ?? '')

  await fillAuBankAccount(page)
  await snap('bank entered')
  await page.getByRole('button', { name: 'Confirm BECS Direct Debit Payment' }).click()

  await expect(page.getByText(/PaymentIntent (processing|succeeded)!/)).toBeVisible()
  await snap('confirmed')
  const intent = await au.paymentIntents.retrieve(created.id, { expand: ['payment_method'] })
  expect(['processing', 'succeeded']).toContain(intent.status)
  expect(typeof intent.payment_method === 'object' && intent.payment_method?.type).toBe(
    'au_becs_debit'
  )
})

/** BSB 000-000 with account 000123456: processing, then succeeded (guide/testing). */
async function fillAuBankAccount(page: Page): Promise<void> {
  const bank = elementFrame(page, '.vue-stripe-au-bank-account-element')
  await expect(bank.locator('input[name="au_bsb"]')).toBeVisible({ timeout: 60_000 })
  await bank.locator('input[name="au_bsb"]').fill('000000')
  await bank.locator('input[name="au_bank_account_number"]').fill('000123456')
}
