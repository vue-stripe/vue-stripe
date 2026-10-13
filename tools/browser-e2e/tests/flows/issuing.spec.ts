import { config } from '../../src/config.ts'
import { test } from '../../src/fixtures.ts'

// Issuing Elements show an issued card's details. They need an account with Stripe Issuing
// (which Stripe Sales enables), an issued card, a page that renders the elements and a server
// route that turns an ephemeral key nonce into an ephemeral key. The sandbox has no Issuing,
// neither the docs nor the playground has an Issuing demo, and apps/backend has no
// ephemeral-key route, so there is nothing to drive in a browser yet.
test('issuing elements: display an issued card', () => {
  test.skip(
    !config.issuing,
    'Stripe Issuing is not enabled on the sandbox (Stripe Sales enables it). Opt in with ISSUING=1'
  )
  test.skip(
    true,
    'Missing pieces: no Issuing demo page (docs or playground) and no ephemeral-key route in ' +
      'apps/backend (POST /api/issuing-ephemeral-key taking { issuingCard, nonce }). ' +
      'See README "Issuing".'
  )
})
