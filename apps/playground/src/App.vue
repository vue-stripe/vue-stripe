<script setup lang="ts">
import { ref, provide, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

// Get Stripe config from environment variables
const stripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  clientSecret: import.meta.env.VITE_STRIPE_CLIENT_SECRET || '',
  setupSecret: import.meta.env.VITE_STRIPE_SETUP_SECRET || '',
  sessionId: import.meta.env.VITE_STRIPE_SESSION_ID || ''
}

// Provide config to all child components
provide('stripeConfig', stripeConfig)

const isMenuOpen = ref(false)
const router = useRouter()

// Get current routes for navigation
const routes = computed(() => router.getRoutes().filter(r => r.name !== 'home'))

const hasKey = computed(() => !!stripeConfig.publishableKey && stripeConfig.publishableKey !== 'pk_test_your_key_here')
</script>

<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div class="header-title">
          <RouterLink to="/" style="text-decoration: none; color: inherit;">
            <h1>Vue Stripe Testing</h1>
          </RouterLink>
          <p>Component & Composable Test Playground</p>
        </div>

        <button
          class="menu-toggle"
          @click="isMenuOpen = !isMenuOpen"
          v-if="routes.length > 0"
        >
          ☰
        </button>
      </div>

      <nav class="nav" :class="{ 'nav-open': isMenuOpen }" v-if="routes.length > 0">
        <RouterLink
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-link"
          @click="isMenuOpen = false"
        >
          {{ route.name }}
        </RouterLink>
      </nav>

      <!-- Config Status Banner -->
      <div class="config-status" :class="{ 'has-key': hasKey }">
        <template v-if="hasKey">
          ✅ Stripe key configured
        </template>
        <template v-else>
          ⚠️ No Stripe key - Copy <code>.env.example</code> to <code>.env.local</code> and add your test key
        </template>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <RouterView />
      </div>
    </main>

    <footer class="footer">
      <p>Vue Stripe Test Playground</p>
    </footer>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  color: white;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-title h1 {
  font-size: 1.5rem;
  margin: 0 0 0.25rem 0;
  font-weight: 700;
}

.header-title p {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.nav {
  max-width: 1200px;
  margin: 1rem auto 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.config-status {
  max-width: 1200px;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.config-status.has-key {
  background: rgba(40, 167, 69, 0.2);
  border-color: rgba(40, 167, 69, 0.3);
}

.config-status code {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.main {
  flex: 1;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer {
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .nav {
    display: none;
    flex-direction: column;
  }

  .nav-open {
    display: flex;
  }

  .main {
    padding: 1rem;
  }
}
</style>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
}

.demo-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.demo-card h2 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.demo-card p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.btn {
  background: #635bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: #5a52e8;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.event-log {
  background: #1a1a2e;
  color: #00ff88;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8rem;
  padding: 1rem;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.event-log .event {
  margin-bottom: 0.25rem;
  opacity: 0.9;
}

.event-log .event:last-child {
  opacity: 1;
}

.event-log .timestamp {
  color: #888;
  margin-right: 0.5rem;
}

.state-display {
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.state-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.state-item .label {
  font-weight: 600;
  color: #666;
  min-width: 100px;
}

.state-item .value {
  color: #1a1a2e;
}

.state-item .value.success { color: #28a745; }
.state-item .value.error { color: #dc3545; }
.state-item .value.loading { color: #ffc107; }
</style>
