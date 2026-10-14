// VitePress data loader for /usage: the numbers are fetched once per build (see ./usage.ts),
// so the static HTML carries them. A failed fetch leaves figures null; the build goes on.
import { defineLoader } from 'vitepress'
import { loadUsage, type UsageData } from './usage'

declare const data: UsageData
export { data }

export default defineLoader({
  load: () => loadUsage()
})
