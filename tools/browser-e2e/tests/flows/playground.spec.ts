import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import { setPlaygroundKey, waitForFrame } from '../../src/stripe-ui.ts'

test.beforeEach(async ({ page }) => {
  await setPlaygroundKey(page, config.publishableKey)
})

test('pricing table: renders the products of PRICING_TABLE_ID', async ({ page, snap }) => {
  test.skip(!config.pricingTableId, 'Set PRICING_TABLE_ID (prctbl_...) in .env')

  await page.goto(`${config.playgroundUrl}/stripe-pricing-table`)
  await page.getByPlaceholder('prctbl_...').fill(config.pricingTableId)
  await expect(page.locator('stripe-pricing-table')).toBeAttached({ timeout: 60_000 })
  await expect(page.getByText('Loaded', { exact: true })).toBeVisible({ timeout: 60_000 })

  // Stripe renders the table in its own iframe; it lists at least one priced product.
  const table = await waitForFrame(page, 'pricing-table-app')
  await expect(table.locator('body')).toContainText(/[$€£]\s?\d/, { timeout: 60_000 })
  await expect(table.getByRole('button').or(table.getByRole('link')).first()).toBeVisible()
  await page.locator('stripe-pricing-table').scrollIntoViewIfNeeded()
  await snap('pricing table')
})
