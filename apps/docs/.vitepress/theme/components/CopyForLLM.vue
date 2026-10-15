<script setup lang="ts">
// Copies the page's Markdown copy (/guide/testing.md), the file the build writes for language
// models (../../llms.ts): the same text as /llms-full.txt, with the figures the page's
// components show, absolute links and no frontmatter or VitePress-only syntax. The dev server
// has no copies and serves the page source at that URL instead.
import { ref, computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { useAnalytics } from '../composables/useAnalytics'
import { markdownPathOf } from '../data/markdown-copy'

const route = useRoute()
const { frontmatter } = useData()
const { trackEvent } = useAnalytics()
const copied = ref(false)
const loading = ref(false)

// Guide and API pages only; a stub left at a removed page's URL (noindex) has no copy.
const shouldShow = computed(() => {
  const path = route.path
  return (path.startsWith('/guide/') || path.startsWith('/api/')) && !frontmatter.value['noindex']
})

async function fetchMarkdown(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

async function copyMarkdown() {
  if (loading.value || copied.value) return

  loading.value = true

  try {
    const content = fetchMarkdown(withBase(markdownPathOf(route.path.replace(/\.html$/, ''))))
    // Safari allows a clipboard write only inside the click, so hand it the pending text.
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': content.then((text) => new Blob([text], { type: 'text/plain' }))
        })
      ])
    } else {
      await navigator.clipboard.writeText(await content)
    }
    const text = await content

    // Track the copy event in Google Analytics
    trackEvent('copy_for_llm', {
      page_path: route.path,
      content_length: text.length,
      content_type: route.path.startsWith('/guide/') ? 'guide' : 'api'
    })

    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy markdown:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="shouldShow" class="copy-for-llm">
    <button
      class="copy-button"
      :class="{ copied }"
      :disabled="loading"
      :aria-label="copied ? 'Copied!' : 'Copy for LLMs: copy this page as Markdown'"
      :title="copied ? 'Copied!' : 'Copy this page as Markdown for LLMs'"
      @click="copyMarkdown"
    >
      <svg
        v-if="!copied"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span class="button-text">{{ copied ? 'Copied!' : 'Copy for LLMs' }}</span>
    </button>
  </div>
</template>

<style scoped>
.copy-for-llm {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover:not(:disabled) {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand-1);
}

.copy-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copy-button.copied {
  color: var(--vp-c-green-1);
  border-color: var(--vp-c-green-1);
}

.button-text {
  line-height: 1;
}

@media (max-width: 640px) {
  .button-text {
    display: none;
  }

  .copy-button {
    padding: 8px;
  }
}
</style>
