import { config } from '../../src/config.ts'
import { test } from '../../src/fixtures.ts'

// Issuing Elements show an issued card's details. They need an account onboarded to Stripe
// Issuing, an issued card, and a server route that turns an ephemeral key nonce into an
// ephemeral key. Neither the docs nor the playground has an Issuing demo, and apps/backend
// has no ephemeral-key route, so there is nothing to drive in a browser yet.
test('issuing elements: display an issued card', () => {
  test.skip(!config.issuing, 'Opt-in: set ISSUING=1 on an account onboarded to Stripe Issuing')
  test.skip(
    true,
    'Missing pieces: no Issuing demo page (docs or playground) and no ephemeral-key route in ' +
      'apps/backend (POST /api/issuing-ephemeral-key taking { issuingCard, nonce }). ' +
      'See README "Issuing".'
  )
})
