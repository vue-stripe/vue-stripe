<script setup lang="ts">
// The source bar under each live demo (live-demo/*.md): a GitHub link to the demo component and
// an "Open in StackBlitz" button. The page passes the code tabs in the slot as `<<<` snippet
// imports, so the code shown is the file the demo runs.
//
// StackBlitz gets a Vite + Vue project with the demo component and every local file it imports,
// at the same paths under src/ as under .vitepress/theme/, so the relative imports work as they
// are. The project uses the published @vue-stripe/vue-stripe, this site's test publishable key
// and the public demo backend, which allows any origin.
import { computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import {
  version as vueStripeVersion,
  peerDependencies as vueStripePeers
} from '@vue-stripe/vue-stripe/package.json'
import { dependencies as docsDependencies } from '../../../package.json'
import { useStripeConfig } from '../composables/useStripeConfig'
import DocIcon from './DocIcon.vue'

const props = defineProps<{
  /** The demo component's file name in ./examples/, without `.vue`, e.g. `CardElementExample`. */
  example: string
}>()

const REPO = 'https://github.com/vue-stripe/vue-stripe'
const THEME_DIR = 'apps/docs/.vitepress/theme'
const DEMO_BACKEND = 'https://backend.vuestripe.com'
// A literal closing script tag would end this component's own <script> block.
const SCRIPT_END = '</' + 'script>'

const { page } = useData()
const { publishableKey } = useStripeConfig()

// "Card Element Example" -> "Card Element"
const title = computed(() => page.value.title.replace(/ Example$/, ''))
const demoPath = computed(() => `components/examples/${props.example}.vue`)
const sourceUrl = computed(() => `${REPO}/blob/main/${THEME_DIR}/${demoPath.value}`)

// The files a demo can import, loaded as text on demand, keyed by their path under theme/.
const loaders = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>(
      ['./examples/*.vue', './examples/*.css', './DocIcon.vue', '../composables/*.ts'],
      { query: '?raw', import: 'default' }
    )
  ).map(([key, load]) => [themePath(key, 'components/'), load])
)

/** `../composables/a.ts` imported from `components/examples/X.vue` -> `composables/a.ts`. */
function themePath(specifier: string, from: string): string {
  return new URL(specifier, `file:///theme/${from}`).pathname.slice('/theme/'.length)
}

/** The demo component and the local files it imports, recursively, keyed by theme/ path. */
async function collectSources(entry: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const pending = [entry]
  while (pending.length) {
    const path = pending.pop()!
    if (path in files) continue
    const code = await loaders[path]!()
    files[path] = code
    const dir = path.slice(0, path.lastIndexOf('/') + 1)
    const imports = code.matchAll(/(?:from|import)\s+'(\.\.?\/[^']+)'|\bsrc="(\.\.?\/[^"]+)"/g)
    for (const [, specifier = '', src = ''] of imports) {
      const resolved = themePath(specifier || src, dir)
      const found = [resolved, `${resolved}.ts`].find((p) => p in loaders)
      if (!found) throw new Error(`DemoSource: ${path} imports ${resolved}, which is not loadable`)
      pending.push(found)
    }
  }
  return files
}

let sources: Promise<Record<string, string>> | undefined
const loadSources = () => (sources ??= collectSources(demoPath.value))

// Load the files with the page, so the click submits right away (a popup needs a recent click).
onMounted(() => void loadSources().catch(() => (sources = undefined)))

/** The StackBlitz project: the demo's files plus a minimal Vite app that renders it. */
function projectFiles(demoFiles: Record<string, string>): Record<string, string> {
  const files: Record<string, string> = {
    'package.json': JSON.stringify(
      {
        name: `vue-stripe-${props.example.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
        private: true,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: {
          '@lucide/vue': docsDependencies['@lucide/vue'],
          '@stripe/stripe-js': vueStripePeers['@stripe/stripe-js'],
          '@vue-stripe/vue-stripe': `^${vueStripeVersion}`,
          vue: '^3.5.0'
        },
        devDependencies: { '@vitejs/plugin-vue': '^6.0.0', vite: '^8.0.0' }
      },
      null,
      2
    ),
    // The env values go in the config: StackBlitz drops dotfiles such as .env from the project.
    'vite.config.ts': [
      "import { defineConfig } from 'vite'",
      "import vue from '@vitejs/plugin-vue'",
      '',
      'export default defineConfig({',
      '  plugins: [vue()],',
      '  // Stripe test mode: the publishable key and backend the Vue Stripe docs demos use.',
      '  // Replace them with your own test key and backend to run the demo on your account.',
      '  define: {',
      `    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify('${publishableKey.value}'),`,
      `    'import.meta.env.VITE_API_URL': JSON.stringify('${DEMO_BACKEND}')`,
      '  }',
      '})',
      ''
    ].join('\n'),
    'index.html': [
      '<!doctype html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `    <title>${title.value} | Vue Stripe</title>`,
      '  </head>',
      '  <body>',
      '    <div id="app"></div>',
      `    <script type="module" src="/src/main.ts">${SCRIPT_END}`,
      '  </body>',
      '</html>',
      ''
    ].join('\n'),
    'src/main.ts': [
      "import { createApp } from 'vue'",
      "import '@vue-stripe/vue-stripe/style.css'",
      "import './theme.css'",
      "import App from './App.vue'",
      '',
      "createApp(App).mount('#app')",
      ''
    ].join('\n'),
    'src/App.vue': [
      '<script setup lang="ts">',
      `import Demo from './${demoPath.value}'`,
      SCRIPT_END,
      '',
      '<template>',
      '  <main>',
      `    <h1>${title.value}</h1>`,
      `    <p>From the <a href="${window.location.href.split(/[?#]/)[0]}" target="_blank">Vue Stripe docs</a>. Stripe test mode: <a href="${window.location.origin}/guide/testing" target="_blank">test cards and accounts</a>.</p>`,
      '    <Demo />',
      '  </main>',
      '</template>',
      ''
    ].join('\n'),
    // The docs theme variables the demo styles use (VitePress defines them on the site).
    'src/theme.css': `:root {
  --vp-c-brand-1: #5146e5;
  --vp-c-brand-2: #635bff;
  --vp-c-brand-soft: rgba(99, 91, 255, 0.14);
  --vp-c-indigo-1: #3451b2;
  --vp-c-indigo-soft: rgba(100, 108, 255, 0.14);
  --vp-c-green-1: #42b883;
  --vp-c-green-soft: rgba(66, 184, 131, 0.14);
  --vp-c-green-darker: #2f855a;
  --vp-c-yellow-1: #fed968;
  --vp-c-yellow-soft: rgba(254, 217, 104, 0.14);
  --vp-c-yellow-darker: #7a4b00;
  --vp-c-danger-1: #9f1d22;
  --vp-c-danger-soft: rgba(244, 63, 94, 0.14);
  --vp-c-bg: #ffffff;
  --vp-c-bg-soft: #f6f8fa;
  --vp-c-text-1: rgb(60, 60, 67);
  --vp-c-text-2: rgba(60, 60, 67, 0.78);
  --vp-c-text-3: rgba(60, 60, 67, 0.74);
  --vp-c-divider: rgba(60, 60, 67, 0.29);
  --vp-font-family-base: ui-sans-serif, system-ui, sans-serif;
  --vp-font-family-mono: ui-monospace, Menlo, Monaco, Consolas, monospace;
}

body {
  margin: 0;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

main > p {
  color: var(--vp-c-text-2);
}

a {
  color: var(--vp-c-brand-1);
}
`
  }
  for (const [path, code] of Object.entries(demoFiles)) files[`src/${path}`] = code
  return files
}

// StackBlitz's POST API (https://developer.stackblitz.com/platform/api/post-api): a `node`
// project runs `npm install` and `npm run dev` in a WebContainer.
async function openInStackBlitz() {
  const files = projectFiles(await loadSources())
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `https://stackblitz.com/run?file=${encodeURIComponent(`src/${demoPath.value}`)}`
  form.target = '_blank'
  const fields: Record<string, string> = {
    'project[title]': `Vue Stripe: ${title.value}`,
    'project[description]': `The ${title.value} live demo from the Vue Stripe docs, in Stripe test mode.`,
    'project[template]': 'node'
  }
  for (const [path, code] of Object.entries(files)) fields[`project[files][${path}]`] = code
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.append(input)
  }
  document.body.append(form)
  form.submit()
  form.remove()
}
</script>

<template>
  <div class="demo-source">
    <div class="demo-source-bar">
      <p class="demo-source-text">
        The code the demo above runs. Open it in StackBlitz to run and fork it with every file it
        imports, in Stripe test mode against the demo backend.
      </p>
      <div class="demo-source-actions">
        <a class="demo-source-button" :href="sourceUrl" target="_blank" rel="noopener">
          <DocIcon name="file-code" :size="16" />
          View source on GitHub
        </a>
        <button
          type="button"
          class="demo-source-button demo-source-button--primary"
          @click="openInStackBlitz"
        >
          <DocIcon name="zap" :size="16" />
          Open in StackBlitz
        </button>
      </div>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.demo-source-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin: 1rem 0;
}

.vp-doc .demo-source-text {
  flex: 1 1 18rem;
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.demo-source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.vp-doc a.demo-source-button,
.demo-source-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.vp-doc a.demo-source-button:hover,
.demo-source-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.demo-source-button--primary {
  border-color: transparent;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.demo-source-button--primary:hover {
  border-color: transparent;
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
}

/* Whole components: keep each tab to a scrollable height so the page stays readable. */
.demo-source :deep(div[class*='language-'] pre) {
  max-height: 32rem;
  overflow: auto;
}
</style>
