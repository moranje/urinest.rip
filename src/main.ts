import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index'
import { handleError } from './lib/errors'
import { initErrorContext } from './lib/error-context'
import { initLogSink, flushLogs } from './lib/log-sink'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Global error handlers
app.config.errorHandler = (err, _instance, info) => {
  handleError(err as Error, `vue:${info}`)
}

window.addEventListener('unhandledrejection', (e) => {
  e.preventDefault()
  handleError(e.reason, 'unhandled-rejection')
})

// Initialize error context, log sink, and auth
initErrorContext()
initLogSink()

import { useAuthStore } from './store/authStore'
useAuthStore().init()

// Flush pending logs on page unload
window.addEventListener('beforeunload', () => flushLogs())

app.mount('#app')
