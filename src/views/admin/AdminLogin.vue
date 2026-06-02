<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import Button from "../../components/primitives/Button.vue";
import IconButton from "../../components/primitives/IconButton.vue";
import Input from "../../components/primitives/Input.vue";
import Notice from "../../components/molecules/Notice.vue";

const router = useRouter();
const route = useRoute();
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
const sessionExpired = computed(() => route.query.expired === "1");
const redirectTarget = computed(() =>
  typeof route.query.redirect === "string" && route.query.redirect.startsWith("/admin")
    ? route.query.redirect
    : "/admin/logs",
);

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
    router.push(redirectTarget.value);
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
      <Notice v-if="sessionExpired" variant="warning" role="status">
        Sessie verlopen. Log opnieuw in.
      </Notice>
      <Input
        id="email"
        v-model="email"
        label="E-mail"
        type="email"
        autocomplete="email"
        inputmode="email"
        enterkeyhint="next"
        required
        error-role="alert"
        :error="emailInvalid ? 'Voer een geldig e-mailadres in' : ''"
      />
      <div class="password-field">
        <Input
          id="password"
          v-model="password"
          class="password-field__input"
          label="Wachtwoord"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          enterkeyhint="go"
          required
          error-role="alert"
          :error="passwordInvalid ? 'Wachtwoord is verplicht' : ''"
        />
        <IconButton
          class="password-field__toggle"
          :icon="showPassword ? 'eye-off' : 'eye'"
          :aria-label="showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
        />
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

.password-field {
  position: relative;
}

.password-field__input {
  width: 100%;
}

.password-field :deep(.input-field__control) {
  width: 100%;
}

.password-field__input :deep(.input-field__control) {
  padding-right: calc(var(--min-touch-target) + var(--spacing-xs));
}

.password-field__toggle {
  position: absolute;
  right: var(--spacing-xs);
  top: calc(1.45em + var(--spacing-xs) + (var(--min-touch-target) / 2));
  transform: translateY(-50%);
}
</style>
