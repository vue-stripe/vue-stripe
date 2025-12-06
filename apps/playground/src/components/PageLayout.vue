<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <header v-if="title || $slots.header" class="mb-2">
      <slot name="header">
        <h1 class="text-2xl font-bold text-white mb-2">{{ title }}</h1>
        <p v-if="description" class="text-white/85 text-base leading-relaxed">
          {{ description }}
        </p>
      </slot>
    </header>
    <slot />
  </div>
</template>
