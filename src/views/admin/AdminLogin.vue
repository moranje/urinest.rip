<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function handleSubmit() {
  if (!email.value.trim() || !password.value) return

  submitting.value = true
  try {
    await authStore.signIn(email.value.trim(), password.value)
    router.push('/admin/logs')
  } catch (e) {
    toastStore.error(e instanceof Error ? e.message : 'Inloggen mislukt')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>Admin Login</h1>
      <div class="field">
        <label for="email">E-mail</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="password">Wachtwoord</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit" class="login-btn" :disabled="submitting || !email.trim() || !password">
        {{ submitting ? 'Bezig...' : 'Inloggen' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--layout-header-height));
  padding: var(--spacing-lg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

h1 {
  font: var(--md-sys-typescale-headline-small);
  color: var(--md-sys-color-on-surface);
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

label {
  font: var(--md-sys-typescale-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}

input {
  padding: var(--spacing-sm) var(--spacing-md);
  font: var(--md-sys-typescale-body-medium);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  outline: none;
  transition: border-color var(--motion-duration-short) var(--motion-easing-standard);
}

input:focus {
  border-color: var(--md-sys-color-primary);
}

.login-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  font: var(--md-sys-typescale-label-large);
  font-weight: 600;
  color: var(--md-sys-color-on-primary);
  background: var(--md-sys-color-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  transition: opacity var(--motion-duration-short) var(--motion-easing-standard);
  margin-top: var(--spacing-sm);
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
