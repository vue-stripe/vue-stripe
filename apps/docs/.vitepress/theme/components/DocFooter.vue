<script setup lang="ts">
// Wraps VitePress's VPDocFooter (aliased in config.ts). Its <footer> sat outside <main>, so it
// was a second contentinfo landmark beside the site footer (axe landmark-no-duplicate-contentinfo
// and landmark-unique). Inside a named <section> a <footer> is not contentinfo, and the "Last
// updated" line is still inside a landmark (axe region); the pager is a navigation landmark.
import VPDocFooter from 'vitepress/dist/client/theme-default/components/VPDocFooter.vue'
</script>

<template>
  <section aria-label="Page details">
    <VPDocFooter>
      <template #doc-footer-before><slot name="doc-footer-before" /></template>
    </VPDocFooter>
  </section>
</template>
