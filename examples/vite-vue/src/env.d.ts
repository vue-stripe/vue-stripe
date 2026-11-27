interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  /** Where the /api routes live. Empty: this app's own server.js, through the Vite proxy. */
  readonly VITE_API_URL?: string
}
