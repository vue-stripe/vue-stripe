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
        <div class="config-status-content">
          <template v-if="hasKey">
            <span>✅ Stripe key: <code>{{ stripeConfig.publishableKey.slice(0, 12) }}...{{ stripeConfig.publishableKey.slice(-4) }}</code></span>
          </template>
          <template v-else>
            <span>⚠️ No Stripe key configured</span>
          </template>
          <button class="config-btn" @click="openConfigModal">
            {{ hasKey ? '⚙️ Change' : '🔑 Add Key' }}
          </button>
        </div>
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

    <!-- Config Modal -->
    <div v-if="showConfigModal" class="modal-overlay" @click.self="showConfigModal = false">
      <div class="modal">
        <h2>🔑 Stripe Configuration</h2>
        <p class="modal-description">
          Enter your Stripe test keys. These are stored in your browser's localStorage
          and never sent anywhere.
        </p>

        <div class="form-group">
          <label for="publishableKey">Publishable Key <span class="required">*</span></label>
          <input
            id="publishableKey"
            v-model="tempPublishableKey"
            type="text"
            placeholder="pk_test_..."
            class="input"
            :class="{ 'input-valid': tempPublishableKey.startsWith('pk_test_') }"
          />
          <p class="hint">
            Get this from <a href="https://dashboard.stripe.com/test/apikeys" target="_blank">Stripe Dashboard → API Keys</a>
          </p>
        </div>

        <div class="form-group">
          <label for="clientSecret">Client Secret <span class="optional">(optional)</span></label>
          <input
            id="clientSecret"
            v-model="tempClientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx or seti_xxx_secret_xxx"
            class="input"
          />
          <p class="hint">
            Needed for Payment Element. Create a PaymentIntent in your Dashboard or via API.
          </p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showConfigModal = false">
            Cancel
          </button>
          <button
            class="btn btn-danger"
            @click="resetConfig"
            v-if="hasKey"
          >
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

        <div class="security-note">
          <strong>🔒 Security Note:</strong> Only use test keys (pk_test_...) here.
          Never enter live keys in development tools.
        </div>
      </div>
    </div>
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

.config-status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.config-status code {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.config-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.config-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.modal-description {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.required {
  color: #dc3545;
}

.optional {
  color: #888;
  font-weight: normal;
  font-size: 0.85rem;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #635bff;
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
}

.input-valid {
  border-color: #28a745;
}

.hint {
  font-size: 0.75rem;
  color: #888;
  margin: 0.5rem 0 0 0;
}

.hint a {
  color: #635bff;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #635bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a52e8;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.security-note {
  margin-top: 1.5rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #856404;
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

  .config-status-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions .btn {
    width: 100%;
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
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.demo-card h2 {
  margin: 0 0 1rem 0;
  color: #1a1a2e;
}

.demo-card h3 {
  margin: 0 0 1.25rem 0;
  color: #1a1a2e;
}

.demo-card h4 {
  margin: 1.5rem 0 1rem 0;
  color: #333;
}

.demo-card p {
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.demo-card ul, .demo-card ol {
  margin: 0 0 1.5rem 0;
  padding-left: 1.5rem;
}

.demo-card li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
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
  font-size: 0.85rem;
  padding: 1.25rem;
  border-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.event-log .event {
  margin-bottom: 0.5rem;
  opacity: 0.9;
  padding: 0.25rem 0;
}

.event-log .event:last-child {
  opacity: 1;
}

.event-log .timestamp {
  color: #888;
  margin-right: 0.75rem;
}

.state-display {
  display: grid;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.state-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.state-item .label {
  font-weight: 600;
  color: #666;
  min-width: 120px;
}

.state-item .value {
  color: #1a1a2e;
}

.state-item .value.success { color: #28a745; }
.state-item .value.error { color: #dc3545; }
.state-item .value.loading { color: #ffc107; }

/* Global table styles */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0 1.5rem 0;
}

table th,
table td {
  text-align: left;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
}

table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

table code {
  background: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Global code block styles */
.code-block {
  background: #1a1a2e;
  color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 1rem 0 1.5rem 0;
  line-height: 1.5;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

/* Global form spacing */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #635bff;
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
}

/* Section dividers */
.section-divider {
  border-top: 1px solid #eee;
  margin: 2rem 0;
  padding-top: 2rem;
}

/* Button groups */
.button-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}

/* Info/Warning boxes */
.info-box {
  background: #e8f4f8;
  border-left: 4px solid #17a2b8;
  padding: 1.25rem 1.5rem;
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
}

.warning-box {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1.25rem 1.5rem;
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
}

.success-box {
  background: #d4edda;
  border-left: 4px solid #28a745;
  padding: 1.25rem 1.5rem;
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
}
</style>
