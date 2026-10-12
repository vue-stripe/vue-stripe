/// <reference types="vite/client" />

// Variables inlined at build time through `vite.define` in config.ts.
interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_API_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
