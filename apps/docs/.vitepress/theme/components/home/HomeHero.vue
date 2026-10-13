<script setup lang="ts">
// Home page hero: the copy across the full width, then a code editor showing a complete
// Payment Element checkout in three files. Each file is a highlighted code fence passed
// from index.md through a named slot (checkout, paybutton, server); the explorer and the
// tabs switch between them.
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import StripeBadge from '../StripeBadge.vue'
import GitHubStarsCTA from '../GitHubStarsCTA.vue'
import DocIcon from '../DocIcon.vue'

type FileId = 'checkout' | 'paybutton' | 'server'

const FILES: { id: FileId; name: string; folder: string; language: string }[] = [
  { id: 'checkout', name: 'CheckoutPage.vue', folder: 'src', language: 'Vue' },
  { id: 'paybutton', name: 'PayButton.vue', folder: 'src', language: 'Vue' },
  { id: 'server', name: 'server.mjs', folder: '', language: 'JavaScript' }
]

const active = ref<FileId>('checkout')
const activeFile = computed(() => FILES.find((f) => f.id === active.value)!)
const tabId = (id: FileId) => `hero-editor-tab-${id}`
const panelId = (id: FileId) => `hero-editor-panel-${id}`

// Arrow keys move between tabs, as in a tablist.
const onTabKey = (event: KeyboardEvent) => {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const index = FILES.findIndex((f) => f.id === active.value)
  const next = FILES[(index + step + FILES.length) % FILES.length]!
  active.value = next.id
  document.getElementById(tabId(next.id))?.focus()
}
</script>

<template>
  <div class="hero-wrap">
    <section class="hero">
      <div class="hero-copy">
        <StripeBadge />

        <h1 class="hero-title">
          <span class="hero-name">Vue Stripe</span>
          Stripe Elements and Checkout as Vue components
        </h1>

        <p class="hero-lede">
          Components and composables for every Stripe.js element and method, typed and tested on Vue
          3 and Vue 2.7. Drop a provider into your app, render the Payment Element, and confirm with
          one composable.
        </p>

        <div class="hero-actions">
          <a class="hero-btn is-brand" :href="withBase('/guide/first-payment')">Get started</a>
          <a class="hero-btn is-alt" :href="withBase('/live-demo/')">Try the live demos</a>
          <GitHubStarsCTA />
        </div>

        <a class="hero-notice" :href="withBase('/guide/migration-v6')">
          <span class="hero-notice-dot" aria-hidden="true" />
          <span>Now on Stripe.js 10 (Endive)</span>
          <span class="hero-notice-link">What changed in v6</span>
        </a>
      </div>

      <div class="hero-showcase">
        <div class="editor" role="group" aria-label="Example project: a Payment Element checkout">
          <div class="editor-titlebar">
            <span class="editor-lights" aria-hidden="true"><i /><i /><i /></span>
            <span class="editor-title">my-shop</span>
          </div>

          <div class="editor-body">
            <nav class="editor-explorer" aria-label="Files">
              <p class="editor-explorer-heading">Explorer</p>
              <p class="editor-folder">
                <DocIcon name="chevron-down" :size="14" />
                <DocIcon name="folder-open" :size="14" />
                src
              </p>
              <button
                v-for="file in FILES.filter((f) => f.folder === 'src')"
                :key="file.id"
                type="button"
                class="editor-file is-nested"
                :class="{ 'is-active': active === file.id }"
                :aria-current="active === file.id ? 'true' : undefined"
                @click="active = file.id"
              >
                <DocIcon name="file-code" :size="14" />
                {{ file.name }}
              </button>
              <button
                v-for="file in FILES.filter((f) => !f.folder)"
                :key="file.id"
                type="button"
                class="editor-file"
                :class="{ 'is-active': active === file.id }"
                :aria-current="active === file.id ? 'true' : undefined"
                @click="active = file.id"
              >
                <DocIcon name="file-code" :size="14" />
                {{ file.name }}
              </button>
            </nav>

            <div class="editor-main">
              <div class="editor-tabs" role="tablist" aria-label="Open files" @keydown="onTabKey">
                <button
                  v-for="file in FILES"
                  :id="tabId(file.id)"
                  :key="file.id"
                  type="button"
                  role="tab"
                  class="editor-tab"
                  :class="{ 'is-active': active === file.id }"
                  :aria-selected="active === file.id"
                  :aria-controls="panelId(file.id)"
                  :tabindex="active === file.id ? 0 : -1"
                  @click="active = file.id"
                >
                  {{ file.name }}
                </button>
              </div>

              <div
                v-for="file in FILES"
                v-show="active === file.id"
                :id="panelId(file.id)"
                :key="file.id"
                role="tabpanel"
                class="editor-code vp-doc"
                :aria-labelledby="tabId(file.id)"
                tabindex="0"
              >
                <slot :name="file.id" />
              </div>
            </div>
          </div>

          <div class="editor-status" aria-hidden="true">
            <span>main</span>
            <span class="editor-status-right">
              <span>{{ activeFile.language }}</span>
              <span>UTF-8</span>
              <span>Spaces: 2</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Full width, so the showcase glow is only ever cut at the viewport edge */
.hero-wrap {
  overflow-x: clip;
}

.hero {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

@media (min-width: 960px) {
  .hero {
    padding: 72px 32px 88px;
  }
}

.hero-copy :deep(.stripe-badge-link) {
  margin-bottom: 28px;
}

.hero-title {
  margin: 0;
  max-width: 22ch;
  font-size: clamp(34px, 6vw, 60px);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
}

.hero-name {
  display: block;
  margin-bottom: 8px;
  color: var(--vp-c-brand-1);
}

.hero-lede {
  max-width: 62ch;
  margin: 24px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  border-radius: 22px;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.hero-btn.is-brand {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.hero-btn.is-brand:hover {
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
}

.hero-btn.is-alt {
  border-color: var(--vp-c-border);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.hero-btn.is-alt:hover {
  border-color: var(--vp-c-brand-1);
}

.hero-actions :deep(.github-stars-wrapper) {
  margin: 0;
  padding: 0;
}

.hero-actions :deep(.github-stars-cta) {
  height: 44px;
  padding: 0 18px;
  font-size: 15px;
}

/* Endive notice: small, quiet, one line, under the actions */
.hero-notice {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 4px 12px 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  text-decoration: none;
  transition: border-color 0.15s;
}

.hero-notice:hover {
  border-color: var(--vp-c-brand-1);
}

.hero-notice-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--vp-c-green-1);
  box-shadow: 0 0 0 3px var(--vp-c-green-soft);
}

.hero-notice-link {
  color: var(--vp-c-brand-1);
}

.hero a:focus-visible,
.hero button:focus-visible,
.editor-code:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

/* Showcase: the editor, with the brand glow behind it */
.hero-showcase {
  position: relative;
  isolation: isolate;
  margin-top: 56px;
}

.hero-showcase::before,
.hero-showcase::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
}

/* Vue Stripe yellow, top left */
.hero-showcase::before {
  top: -60px;
  left: 6%;
  width: 320px;
  height: 260px;
  background: #fed968;
  filter: blur(90px);
  opacity: 0.7;
}

/* Stripe blurple, bottom right */
.hero-showcase::after {
  right: 2%;
  bottom: -80px;
  width: 520px;
  height: 380px;
  background: #635bff;
  filter: blur(120px);
  opacity: 0.55;
}

.dark .hero-showcase::before {
  opacity: 0.4;
}

.dark .hero-showcase::after {
  opacity: 0.45;
}

/*
 * The editor is dark in both site themes, like most editors, so it reads as an
 * application window. Its code uses Shiki's dark colors in light mode too.
 */
.editor {
  --editor-bg: #1b1b1f;
  --editor-chrome: #141417;
  --editor-line: #2e2e32;
  --editor-text: #dfdfd6;
  --editor-muted: #8b8b93;
  --editor-active: #26262b;

  overflow: hidden;
  border: 1px solid var(--editor-line);
  border-radius: 12px;
  background: var(--editor-bg);
  color: var(--editor-text);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    0 28px 60px -24px rgba(30, 27, 75, 0.55);
  font-family: var(--vp-font-family-base);
}

.editor-titlebar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  background: var(--editor-chrome);
  border-bottom: 1px solid var(--editor-line);
}

.editor-lights {
  position: absolute;
  left: 14px;
  display: flex;
  gap: 8px;
}

.editor-lights i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f57;
}

.editor-lights i:nth-child(2) {
  background: #febc2e;
}

.editor-lights i:nth-child(3) {
  background: #28c840;
}

.editor-title {
  color: var(--editor-muted);
  font-size: 12px;
}

.editor-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 768px) {
  .editor-body {
    grid-template-columns: 200px minmax(0, 1fr);
  }
}

.editor-explorer {
  display: none;
  padding: 10px 0;
  background: var(--editor-chrome);
  border-right: 1px solid var(--editor-line);
  font-size: 13px;
}

@media (min-width: 768px) {
  .editor-explorer {
    display: block;
  }
}

.editor-explorer-heading {
  margin: 0 0 6px;
  padding: 0 14px;
  color: var(--editor-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.editor-folder,
.editor-file {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 4px 14px;
  border: 0;
  background: none;
  color: var(--editor-text);
  font: inherit;
  line-height: 1.5;
  text-align: left;
}

.editor-folder :deep(svg),
.editor-file :deep(svg) {
  flex: none;
  color: var(--editor-muted);
}

.editor-file {
  cursor: pointer;
}

.editor-file.is-nested {
  padding-left: 34px;
}

.editor-file:hover {
  background: var(--editor-active);
}

.editor-file.is-active {
  background: #2f2c5c;
}

.editor-main {
  min-width: 0;
}

.editor-tabs {
  display: flex;
  overflow-x: auto;
  background: var(--editor-chrome);
  border-bottom: 1px solid var(--editor-line);
}

.editor-tab {
  flex: none;
  padding: 9px 16px;
  border: 0;
  border-right: 1px solid var(--editor-line);
  border-top: 2px solid transparent;
  background: none;
  color: var(--editor-muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.editor-tab:hover {
  color: var(--editor-text);
}

.editor-tab.is-active {
  border-top-color: #635bff;
  background: var(--editor-bg);
  color: var(--editor-text);
}

.editor-code {
  max-height: 30rem;
  overflow: auto;
}

/* Tall enough for the longest file, and fixed so switching tabs never moves the page */
@media (min-width: 768px) {
  .editor-code {
    height: 41rem;
    max-height: none;
  }
}

/* The slotted VitePress code block, restyled as the editor surface */
.editor-code :deep(div[class*='language-']) {
  margin: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.editor-code :deep(pre) {
  padding-top: 16px !important;
  padding-bottom: 18px !important;
}

.editor-code :deep(.line-numbers-mode .line-numbers-wrapper) {
  padding-top: 16px;
}

.editor-code :deep(code) {
  font-size: 13px;
  line-height: 1.7;
}

.editor-code :deep(.shiki span) {
  color: var(--shiki-dark) !important;
}

.editor-code :deep(.line-numbers-wrapper) {
  border-right-color: var(--editor-line);
  color: #5c5c66;
  font-size: 13px;
  line-height: 1.7;
}

.editor-code :deep(.lang),
.editor-code :deep(button.copy) {
  display: none;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 12px;
  background: #4b45c6;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
}

.editor-status-right {
  display: flex;
  gap: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .hero-btn,
  .hero-notice {
    transition: none;
  }
}
</style>
