<script setup lang="ts">
// Names each Mermaid diagram for assistive technology. vitepress-mermaid-renderer wraps a
// diagram in a role="img" element labelled "Interactive Mermaid diagram" and puts a second
// aria-label, the first 80 characters of the source, on the inner div, which has no role, so
// ARIA prohibits it there (Lighthouse aria-prohibited-attr). Drop that one and label the
// wrapper with the diagram's own accTitle and accDescr, which Mermaid renders as the SVG's
// <title> and <desc>. The diagrams render after mount and again on a theme change, so a
// MutationObserver applies this each time. Renders nothing.
import { onMounted, onUnmounted } from 'vue'

let observer: MutationObserver | undefined

function label() {
  for (const inner of document.querySelectorAll('.diagram-wrapper .mermaid[aria-label]')) {
    inner.removeAttribute('aria-label')
  }
  for (const wrapper of document.querySelectorAll('.diagram-wrapper[role="img"]')) {
    const svg = wrapper.querySelector('.mermaid svg')
    const title = svg?.querySelector(':scope > title')?.textContent?.trim()
    if (!title) continue
    const description = svg?.querySelector(':scope > desc')?.textContent?.trim()
    const name = description ? `Diagram: ${title}. ${description}` : `Diagram: ${title}`
    if (wrapper.getAttribute('aria-label') !== name) wrapper.setAttribute('aria-label', name)
  }
}

onMounted(() => {
  label()
  observer = new MutationObserver(label)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label']
  })
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <span hidden />
</template>
