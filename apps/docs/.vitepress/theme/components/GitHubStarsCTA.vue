<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stars = ref<number | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/vue-stripe/vue-stripe')
    if (response.ok) {
      const data = await response.json()
      stars.value = data.stargazers_count
    }
  } catch (e) {
    // Silently fail - we'll just not show the count
  } finally {
    loading.value = false
  }
})

function formatStars(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return count.toString()
}
</script>

<template>
  <div class="github-stars-wrapper">
    <a
      href="https://github.com/vue-stripe/vue-stripe"
      target="_blank"
      rel="noopener noreferrer"
      class="github-stars-cta"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="star-icon"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span class="cta-text">Star Us on GitHub</span>
      <span v-if="!loading && stars !== null" class="star-count">
        {{ formatStars(stars) }}
      </span>
    </a>
  </div>
</template>

<style scoped>
.github-stars-wrapper {
  display: inline-block;
  margin-top: 2.5px;
  margin-left: 6px;
  padding: 6px;
}

.github-stars-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
  text-decoration: none;
}

.github-stars-cta:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-elv);
}

.star-icon {
  flex-shrink: 0;
  color: #f59e0b;
}

.cta-text {
  font-weight: 500;
}

.star-count {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  background-color: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
</style>
