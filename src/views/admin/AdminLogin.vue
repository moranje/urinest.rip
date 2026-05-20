<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import Button from "../../components/primitives/Button.vue";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref("");
const password = ref("");
const submitting = ref(false);
const showPassword = ref(false);
const triedSubmit = ref(false);

// RFC 5322-lite — pragmatic, used only for UI hint
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailInvalid = computed(
  () => triedSubmit.value && (!email.value.trim() || !EMAIL_RE.test(email.value.trim())),
);
const passwordInvalid = computed(() => triedSubmit.value && !password.value);

async function handleSubmit() {
  triedSubmit.value = true;
  if (!email.value.trim() || !password.value) return;
  if (!EMAIL_RE.test(email.value.trim())) {
    toastStore.error("Voer een geldig e-mailadres in");
    return;
  }

  submitting.value = true;
  try {
    await authStore.signIn(email.value.trim(), password.value);
    router.push("/admin/logs");
  } catch (e) {
    toastStore.error(e instanceof Error ? e.message : "Inloggen mislukt");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" novalidate @submit.prevent="handleSubmit">
      <h1>Admin Login</h1>
      <div class="field">
        <label for="email">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          enterkeyhint="next"
          required
          :aria-invalid="emailInvalid || undefined"
          :aria-describedby="emailInvalid ? 'email-error' : undefined"
        />
        <p v-if="emailInvalid" id="email-error" class="field-error" role="alert">
          Voer een geldig e-mailadres in
        </p>
      </div>
      <div class="field">
        <label for="password">Wachtwoord</label>
        <div class="password-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            enterkeyhint="go"
            required
            :aria-invalid="passwordInvalid || undefined"
            :aria-describedby="passwordInvalid ? 'password-error' : undefined"
          />
          <button
            type="button"
            class="show-password-toggle"
            :aria-label="showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3s3-1.34 3-3s-1.34-3-3-3z"
              />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 7c2.76 0 5 2.24 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28l.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22L21 20.73L3.27 3L2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65c0 1.66 1.34 3 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53c-2.76 0-5-2.24-5-5c0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15l.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
              />
            </svg>
          </button>
        </div>
        <p v-if="passwordInvalid" id="password-error" class="field-error" role="alert">
          Wachtwoord is verplicht
        </p>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="submitting"
        :disabled="!email.trim() || !password"
      >
        {{ submitting ? "Bezig..." : "Inloggen" }}
      </Button>
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
  transition:
    border-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard);
}

input:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
  border-color: var(--md-sys-color-primary);
}

input:focus {
  border-color: var(--md-sys-color-primary);
}

input[aria-invalid="true"] {
  border-color: var(--md-sys-color-error);
}
input[aria-invalid="true"]:focus-visible {
  outline-color: var(--md-sys-color-error);
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

.field-error {
  font: var(--md-sys-typescale-label-small);
  color: var(--md-sys-color-error);
  margin: 0;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrapper input {
  flex: 1;
  padding-right: calc(var(--min-touch-target) + var(--spacing-xs));
}
.show-password-toggle {
  position: absolute;
  right: var(--spacing-xs);
  top: 50%;
  transform: translateY(-50%);
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
}
.show-password-toggle:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}
</style>
