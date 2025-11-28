<script setup lang="ts">
import { ref, provide, computed, reactive, watch } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

// Storage key for localStorage
const STORAGE_KEY = 'vue-stripe-playground-config'

// Load config from localStorage
const loadConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e)
  }

  // Default empty config - user will provide via UI
  return {
    publishableKey: '',
    clientSecret: '',
    setupSecret: '',
    sessionId: ''
  }
}

// Save config to localStorage
const saveConfig = (config: typeof stripeConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('Failed to save config to localStorage:', e)
  }
}

// Clear config from localStorage
const clearConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear config from localStorage:', e)
  }
}

// Reactive config
const stripeConfig = reactive(loadConfig())

// Save whenever config changes
watch(stripeConfig, (newConfig) => {
  saveConfig(newConfig)
}, { deep: true })

// Provide config to all child components
provide('stripeConfig', stripeConfig)

const isMenuOpen = ref(false)
const showConfigModal = ref(false)
const router = useRouter()

// Temp values for the modal form
const tempPublishableKey = ref(stripeConfig.publishableKey)
const tempClientSecret = ref(stripeConfig.clientSecret)

// Get current routes for navigation
const routes = computed(() => router.getRoutes().filter(r => r.name !== 'home'))

const hasKey = computed(() => {
  return !!stripeConfig.publishableKey &&
    stripeConfig.publishableKey !== 'pk_test_your_key_here' &&
    stripeConfig.publishableKey.startsWith('pk_')
})

const openConfigModal = () => {
  tempPublishableKey.value = stripeConfig.publishableKey
  tempClientSecret.value = stripeConfig.clientSecret
  showConfigModal.value = true
}

const saveConfigModal = () => {
  stripeConfig.publishableKey = tempPublishableKey.value.trim()
  stripeConfig.clientSecret = tempClientSecret.value.trim()
  showConfigModal.value = false
  // Force page reload to reinitialize Stripe with new key
  window.location.reload()
}

const resetConfig = () => {
  if (confirm('Clear all saved Stripe configuration? The page will reload.')) {
    clearConfig()
    window.location.reload()
  }
}
</script>

<template>
  <div id="app">
    <header class="header">
      <!-- Navbar with brand -->
      <div class="navbar">
        <RouterLink to="/" class="navbar-brand">
          <span class="navbar-logo">💳</span>
          <div class="navbar-brand-text">
            <span class="navbar-title">Vue Stripe</span>
            <span class="navbar-subtitle">Component Testing Playground</span>
          </div>
        </RouterLink>

        <button class="navbar-toggle" @click="isMenuOpen = !isMenuOpen" v-if="routes.length > 0">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- Navigation Tabs -->
      <nav class="nav-tabs" :class="{ 'nav-open': isMenuOpen }" v-if="routes.length > 0">
        <RouterLink
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-tab"
          @click="isMenuOpen = false"
        >
          {{ route.name }}
        </RouterLink>
      </nav>

      <!-- Status Bar for Config -->
      <div class="status-bar" :class="hasKey ? 'status-bar-success' : 'status-bar-warning'">
        <span v-if="hasKey" class="status-bar-content">
          <span class="status-dot"></span>
          <code>{{ stripeConfig.publishableKey.slice(0, 12) }}...{{ stripeConfig.publishableKey.slice(-4) }}</code>
        </span>
        <span v-else class="status-bar-content">
          <span class="status-dot"></span>
          No Stripe key configured
        </span>
        <button class="btn btn-sm btn-ghost" @click="openConfigModal">
          {{ hasKey ? 'Change' : 'Add Key' }}
        </button>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <RouterView />
      </div>
    </main>

    <footer class="footer">
      <p>Vue Stripe Playground</p>
    </footer>

    <!-- Config Modal -->
    <Teleport to="body">
      <div v-if="showConfigModal" class="modal-backdrop" @click.self="showConfigModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Stripe Configuration</h2>
            <button class="modal-close" @click="showConfigModal = false">&times;</button>
          </div>

          <div class="modal-body">
            <p class="text-secondary text-sm mb-6">
              Enter your Stripe test keys. These are stored in your browser's localStorage and never sent anywhere.
            </p>

            <div class="form-group">
              <label class="form-label">
                Publishable Key <span class="text-danger">*</span>
              </label>
              <input
                v-model="tempPublishableKey"
                type="text"
                placeholder="pk_test_..."
                class="form-input form-input-mono"
                :class="{ 'is-valid': tempPublishableKey.startsWith('pk_test_') }"
              />
              <p class="form-hint">
                Get this from <a href="https://dashboard.stripe.com/test/apikeys" target="_blank">Stripe Dashboard → API Keys</a>
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Client Secret <span class="text-muted">(optional)</span>
              </label>
              <input
                v-model="tempClientSecret"
                type="text"
                placeholder="pi_xxx_secret_xxx"
                class="form-input form-input-mono"
              />
              <p class="form-hint">
                Needed for Payment Element. Create a PaymentIntent via CLI or API.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showConfigModal = false">
              Cancel
            </button>
            <button v-if="hasKey" class="btn btn-danger" @click="resetConfig">
              Reset All
            </button>
            <button
              class="btn btn-primary"
              @click="saveConfigModal"
              :disabled="!tempPublishableKey.startsWith('pk_')"
            >
              Save & Reload
            </button>
          </div>

          <div class="alert alert-warning mt-4">
            <strong>Security:</strong> Only use test keys (pk_test_...) here. Never enter live keys.
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* Header Layout */
.header {
  color: white;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: var(--container-max);
  margin: 0 auto;
  width: 100%;
}

/* Navbar customization for app header */
.navbar {
  background: rgba(255, 255, 255, 0.1);
}

.navbar-brand-text {
  display: flex;
  flex-direction: column;
}

.navbar-title {
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
}

.navbar-subtitle {
  font-size: var(--text-xs);
  opacity: 0.85;
}

.navbar-logo {
  font-size: var(--text-2xl);
}

/* Status bar code styling */
.status-bar code {
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.status-bar .btn-ghost {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.status-bar .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Main */
.main {
  flex: 1;
  padding: var(--space-8) var(--space-4);
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
}

/* Footer */
.footer {
  text-align: center;
  padding: var(--space-4);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--text-sm);
}

.footer p {
  margin: 0;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  color: var(--color-text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-toggle {
    display: flex;
  }

  .nav-tabs {
    display: none;
    flex-direction: column;
  }

  .nav-tabs.nav-open {
    display: flex;
  }

  .main {
    padding: var(--space-4);
  }

  .status-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>
