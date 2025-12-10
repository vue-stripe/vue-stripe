<script setup lang="ts">
</script>

<template>
  <a
    href="https://stripe.com/partners/directory/vue-stripe"
    target="_blank"
    rel="noopener noreferrer"
    class="stripe-badge-link"
  >
    <img
      src="/stripe_partner_badge_verified_blurple.png"
      alt="Stripe Verified Partner"
      class="stripe-badge"
    />
  </a>
</template>

<style scoped>
.stripe-badge-link {
  display: inline-block;
  margin-bottom: 16px;
  transition: opacity 0.2s ease;
}

.stripe-badge-link:hover {
  opacity: 0.8;
}

.stripe-badge {
  height: 40px;
  width: auto;
}
</style>
