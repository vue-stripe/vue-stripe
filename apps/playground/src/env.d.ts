/// <reference types="vite/client" />

// Lets type-aware ESLint (which only sees .ts files) resolve `.vue` imports.
// vue-tsc resolves the real SFC types and ignores this fallback.
declare module '*.vue' {
  import type { Component } from 'vue'
  const component: Component
  export default component
}

interface ImportMetaEnv {
  /** Test-data backend; defaults to https://backend.vuestripe.com. */
  readonly VITE_API_URL?: string
}
