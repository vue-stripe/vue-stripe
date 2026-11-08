<script setup lang="ts">
// The publication date under a blog post's title, from its `date` frontmatter.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { formatDay } from '../data/usage'

const { frontmatter } = useData()

// VitePress parses an unquoted `date: 2026-11-08` into a Date at midnight UTC.
const date = computed(() => {
  const value = frontmatter.value['date'] as Date | string
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10)
})
</script>

<template>
  <p class="blog-post-date">
    <time :datetime="date">{{ formatDay(date) }}</time>
  </p>
</template>

<style scoped>
.vp-doc .blog-post-date {
  margin-top: 0.75rem;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}
</style>
