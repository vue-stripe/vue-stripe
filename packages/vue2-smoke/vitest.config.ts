import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)

// Runs the *published* library bundle (dist/) on Vue 2.7.16.
// vue-demi is forced to its Vue 2.7 build for everything here, including the
// library bundle, which is inlined so the alias applies to it.
export default defineConfig({
  resolve: { alias: { 'vue-demi': require.resolve('vue-demi/lib/v2.7/index.mjs') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Never inline 'vue': Vitest's native import of vue@2.7 resolves to the CJS
    // build, so @vue/test-utils 1.x, vue-demi and the library share ONE Vue
    // instance. Inlining would load a second copy and break inject()/h().
    server: { deps: { inline: ['@vue-stripe/vue-stripe', 'vue-demi'] } }
  }
})
