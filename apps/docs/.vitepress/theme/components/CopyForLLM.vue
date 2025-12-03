<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vitepress'
import { useAnalytics } from '../composables/useAnalytics'

// Import all markdown files from guide and api directories
const markdownFiles = import.meta.glob(['../../../guide/**/*.md', '../../../api/**/*.md'], {
  query: '?raw',
  import: 'default'
})

const route = useRoute()
const { trackEvent } = useAnalytics()
const copied = ref(false)
const loading = ref(false)

// Only show on guide and api pages
const shouldShow = computed(() => {
  const path = route.path
  return path.startsWith('/guide/') || path.startsWith('/api/')
})

// Get the markdown file path from the route
function getMarkdownPath(routePath: string): string {
  // Remove leading slash and .html extension, add .md
  let path = routePath.replace(/^\//, '').replace(/\.html$/, '')

  // Handle index pages
  if (path.endsWith('/') || path === 'guide' || path === 'api') {
    path = path.replace(/\/$/, '') + '/index'
  }

  return `../../../${path}.md`
}

async function copyMarkdown() {
  if (loading.value || copied.value) return

  loading.value = true

  try {
    const markdownPath = getMarkdownPath(route.path)
    const loader = markdownFiles[markdownPath]

    if (!loader) {
      console.warn('Markdown file not found:', markdownPath)
      loading.value = false
      return
    }

    const content = await loader() as string
    await navigator.clipboard.writeText(content)

    // Track the copy event in Google Analytics
    trackEvent('copy_for_llm', {
      page_path: route.path,
      content_length: content.length,
      content_type: route.path.startsWith('/guide/') ? 'guide' : 'api',
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
      :aria-label="copied ? 'Copied!' : 'Copy page as markdown for LLMs'"
      :title="copied ? 'Copied!' : 'Copy page as markdown for LLMs'"
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
