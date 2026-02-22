/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare const __APP_VERSION__: string

declare module 'virtual:pwa-register/vue' {
  import type { Ref } from 'vue'
  interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }
  function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: Ref<boolean>
    offlineReady: Ref<boolean>
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
  export { useRegisterSW }
  export type { RegisterSWOptions }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_LOG_LEVEL?: string
  readonly VITE_LOG_MODULES?: string
  readonly VITE_UMAMI_SHARE_URL?: string
}

interface Window {
  umami?: { track: (event: string, data?: Record<string, string>) => void }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
