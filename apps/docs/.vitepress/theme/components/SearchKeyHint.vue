<script setup lang="ts">
// Label in name (WCAG 2.5.3): the search button is named "Search", its visible label, but its
// text content also holds the "K" of the "Ctrl K" hint, so the visible text and the name
// disagree. VitePress already draws "Ctrl" with CSS; draw the "K" the same way (the
// `.vs-css-key` rule in styles/vars.css), so the button's text is just its name. Renders nothing.
import { nextTick, onMounted } from 'vue'

onMounted(async () => {
  await nextTick()
  for (const keys of document.querySelectorAll('.DocSearch-Button-Keys')) {
    const key = keys.querySelectorAll('.DocSearch-Button-Key')[1]
    if (!key || key.textContent !== 'K') continue
    key.textContent = ''
    keys.classList.add('vs-css-key')
  }
})
</script>

<template>
  <span hidden />
</template>
