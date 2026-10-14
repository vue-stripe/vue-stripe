// VitePress data loader for /guide/bundle-size and the home page: the built library is measured
// once per build (see ./measure-bundle.ts), so the static HTML carries the numbers. Without a
// built library every figure is empty and the pages show their fallback; the build goes on.
import { defineLoader } from 'vitepress'
import type { BundleSizes } from './bundle-size'
import { loadBundleSizes } from './measure-bundle'

declare const data: BundleSizes
export { data }

export default defineLoader({
  load: () => loadBundleSizes()
})
