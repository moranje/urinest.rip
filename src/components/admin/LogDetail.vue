<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LogGroup, LogEvent } from '../../store/logStore'
import { useLogStore } from '../../store/logStore'
import { useToastStore } from '../../store/toastStore'
import StackTrace from './StackTrace.vue'

const props = defineProps<{
  group: LogGroup
  events: LogEvent[]
  loading: boolean
}>()

const emit = defineEmits<{
  back: []
  resolved: []
}>()

const logStore = useLogStore()
const toastStore = useToastStore()

const resolving = ref(false)
const showResolveInput = ref(false)
const resolveVersion = ref('')
const copyLabel = ref('Kopieer als markdown')

// Extract detail from the most recent event
const latestDetail = computed(() => {
  const d = props.events[0]?.detail ?? {}
  return d as Record<string, unknown>
})

const stack = computed(() => latestDetail.value.stack as string | undefined)
const context = computed(() => latestDetail.value.context as string | undefined)
const devDetail = computed(() => latestDetail.value.devDetail as string | undefined)
const errorClass = computed(() => latestDetail.value.errorClass as string | undefined)
const browser = computed(() => latestDetail.value.browser as string | undefined)
const os = computed(() => latestDetail.value.os as string | undefined)
const deviceType = computed(() => latestDetail.value.deviceType as string | undefined)
const appVersion = computed(() => latestDetail.value.appVersion as string | undefined)
const env = computed(() => latestDetail.value.env as 'dev' | 'prod' | undefined)
const sourceLocation = computed(() => latestDetail.value.sourceLocation as { file: string; line: number; column: number } | undefined)

interface Breadcrumb {
  type: string
  message: string
  timestamp: string
  count?: number
}

const breadcrumbs = computed(() => (latestDetail.value.breadcrumbs ?? []) as Breadcrumb[])

async function handleResolve() {
  resolving.value = true
  try {
    await logStore.resolveGroup(props.group.fingerprint, resolveVersion.value.trim())
    toastStore.success('Error gemarkeerd als opgelost')
    showResolveInput.value = false
    resolveVersion.value = ''
    emit('resolved')
  } catch {
    // handleError covers this
  } finally {
    resolving.value = false
  }
}

async function handleSuppress() {
  resolving.value = true
  try {
    await logStore.suppressGroup(props.group.fingerprint)
    toastStore.success('Error onderdrukt')
    emit('resolved')
  } catch {
    // handleError covers this
  } finally {
    resolving.value = false
  }
}

async function handleUnresolve() {
  resolving.value = true
  try {
    await logStore.unresolveGroup(props.group.fingerprint)
    toastStore.success('Markering opgeheven')
    emit('resolved')
  } catch {
    // handleError covers this
  } finally {
    resolving.value = false
  }
}

function levelBadgeClass(level: string): string {
  if (level === 'error') return 'badge-error'
  return 'badge-warn'
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatBreadcrumbTime(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} uur geleden`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'gisteren'
  return `${diffD} dagen geleden`
}

async function exportMarkdown() {
  const lines: string[] = []

  lines.push(`# ${props.group.level.toUpperCase()}: ${props.group.message}`)
  lines.push('')

  lines.push('## Samenvatting')
  lines.push('')
  lines.push('| Eigenschap | Waarde |')
  lines.push('|---|---|')
  lines.push(`| **Module** | \`${props.group.module}\` |`)
  lines.push(`| **Level** | ${props.group.level} |`)
  lines.push(`| **Events** | ${props.group.count} |`)
  lines.push(`| **Eerste keer** | ${props.group.first_seen} |`)
  lines.push(`| **Laatste keer** | ${props.group.last_seen} |`)
  lines.push(`| **Fingerprint** | \`${props.group.fingerprint}\` |`)
  if (props.group.status !== 'open') {
    lines.push(`| **Status** | ${props.group.status}${props.group.resolved_in_version ? ` (v${props.group.resolved_in_version})` : ''} |`)
  }
  lines.push('')

  const contextItems: [string, string][] = []
  if (context.value) contextItems.push(['Context', context.value])
  if (errorClass.value) contextItems.push(['Error class', `\`${errorClass.value}\``])
  if (devDetail.value) contextItems.push(['Detail', devDetail.value])
  if (browser.value) contextItems.push(['Browser', browser.value])
  if (os.value) contextItems.push(['OS', os.value])
  if (deviceType.value) contextItems.push(['Device', deviceType.value])
  if (appVersion.value) contextItems.push(['App versie', `\`${appVersion.value}\``])
  if (env.value) contextItems.push(['Environment', env.value])
  if (sourceLocation.value) contextItems.push(['Bronlocatie', `\`${sourceLocation.value.file}:${sourceLocation.value.line}:${sourceLocation.value.column}\``])

  if (contextItems.length > 0) {
    lines.push('## Context')
    lines.push('')
    lines.push('| Eigenschap | Waarde |')
    lines.push('|---|---|')
    for (const [label, value] of contextItems) {
      lines.push(`| **${label}** | ${value} |`)
    }
    lines.push('')
  }

  if (stack.value) {
    lines.push('## Stack trace')
    lines.push('')
    lines.push('```')
    lines.push(stack.value)
    lines.push('```')
    lines.push('')
  }

  if (breadcrumbs.value.length > 0) {
    lines.push(`## Breadcrumbs (${breadcrumbs.value.length})`)
    lines.push('')
    lines.push('| Type | Bericht | Tijd |')
    lines.push('|---|---|---|')
    for (const crumb of breadcrumbs.value) {
      const countSuffix = crumb.count && crumb.count > 1 ? ` (x${crumb.count})` : ''
      lines.push(`| ${crumb.type} | ${crumb.message}${countSuffix} | ${formatBreadcrumbTime(crumb.timestamp)} |`)
    }
    lines.push('')
  }

  if (props.events.length > 0) {
    const recentEvents = props.events.slice(0, 10)
    lines.push(`## Recente events (${recentEvents.length} van ${props.events.length})`)
    lines.push('')
    lines.push('| Tijd | Sessie | Browser | Context | URL |')
    lines.push('|---|---|---|---|---|')
    for (const event of recentEvents) {
      const ed = (event.detail ?? {}) as Record<string, unknown>
      lines.push(`| ${formatTimestamp(event.created_at)} | ${event.session_id?.slice(0, 8) ?? '-'} | ${ed.browser ?? '-'} | ${ed.context ?? '-'} | ${event.url ?? '-'} |`)
    }
    lines.push('')
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyLabel.value = 'Gekopieerd!'
    setTimeout(() => { copyLabel.value = 'Kopieer als markdown' }, 2000)
  } catch {
    // Clipboard not available
  }
}
</script>

<template>
  <div class="log-detail">
    <div class="detail-toolbar">
      <button class="back-btn" @click="emit('back')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Terug
      </button>
      <button class="export-btn" :title="'Kopieer als markdown voor LLM-prompt'" @click="exportMarkdown">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {{ copyLabel }}
      </button>
    </div>

    <div class="detail-header">
      <span :class="['level-badge', levelBadgeClass(group.level)]">{{ group.level.toUpperCase() }}</span>
      <h2>{{ group.message }}</h2>
    </div>

    <div class="detail-meta">
      <div class="meta-row">
        <span class="meta-label">Module</span>
        <span class="meta-value">{{ group.module }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Events</span>
        <span class="meta-value">{{ group.count }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Eerste keer</span>
        <span class="meta-value">{{ timeAgo(group.first_seen) }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Laatste keer</span>
        <span class="meta-value">{{ timeAgo(group.last_seen) }}</span>
      </div>
    </div>

    <div class="detail-actions">
      <template v-if="group.status === 'resolved' || group.status === 'suppressed'">
        <span class="resolution-info">
          {{ group.status === 'resolved' ? 'Opgelost' : 'Onderdrukt' }}
          <template v-if="group.resolved_in_version"> in v{{ group.resolved_in_version }}</template>
        </span>
        <button class="action-btn" :disabled="resolving" @click="handleUnresolve">
          Markering opheffen
        </button>
      </template>
      <template v-else>
        <template v-if="showResolveInput">
          <div class="resolve-input-row">
            <input v-model="resolveVersion" type="text" placeholder="Versie (bijv. 0.5.1)" class="resolve-version-input" />
            <button class="action-btn action-resolve" :disabled="resolving || !resolveVersion.trim()" @click="handleResolve">Bevestig</button>
            <button class="action-btn" @click="showResolveInput = false; resolveVersion = ''">Annuleer</button>
          </div>
        </template>
        <template v-else>
          <button class="action-btn action-resolve" :disabled="resolving" @click="showResolveInput = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Opgelost
          </button>
        </template>
        <button class="action-btn action-suppress" :disabled="resolving" @click="handleSuppress">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          Onderdrukken
        </button>
      </template>
    </div>

    <div class="detail-sections">
      <!-- Context info -->
      <section class="detail-section">
        <h3>Context</h3>
        <div class="context-grid">
          <div v-if="context" class="context-item">
            <span class="context-label">Context</span>
            <span class="context-value">{{ context }}</span>
          </div>
          <div v-if="errorClass" class="context-item">
            <span class="context-label">Error class</span>
            <span class="context-value code">{{ errorClass }}</span>
          </div>
          <div v-if="devDetail" class="context-item">
            <span class="context-label">Detail</span>
            <span class="context-value">{{ devDetail }}</span>
          </div>
          <div v-if="browser" class="context-item">
            <span class="context-label">Browser</span>
            <span class="context-value">{{ browser }}</span>
          </div>
          <div v-if="os" class="context-item">
            <span class="context-label">OS</span>
            <span class="context-value">{{ os }}</span>
          </div>
          <div v-if="deviceType" class="context-item">
            <span class="context-label">Device</span>
            <span class="context-value">{{ deviceType }}</span>
          </div>
          <div v-if="appVersion" class="context-item">
            <span class="context-label">Versie</span>
            <span class="context-value code">
              {{ appVersion }}
              <span v-if="env" :class="['env-badge', env === 'dev' ? 'env-dev' : 'env-prod']">{{ env }}</span>
            </span>
          </div>
          <div v-if="sourceLocation" class="context-item">
            <span class="context-label">Locatie</span>
            <span class="context-value code">{{ sourceLocation.file }}:{{ sourceLocation.line }}:{{ sourceLocation.column }}</span>
          </div>
        </div>
      </section>

      <!-- Stack trace -->
      <section v-if="stack" class="detail-section">
        <h3>Stack trace</h3>
        <StackTrace :stack="stack" />
      </section>

      <!-- Breadcrumbs -->
      <section v-if="breadcrumbs.length > 0" class="detail-section">
        <h3>Breadcrumbs ({{ breadcrumbs.length }})</h3>
        <div class="breadcrumb-list">
          <div v-for="(crumb, i) in breadcrumbs" :key="i" class="breadcrumb-row">
            <span :class="['breadcrumb-type', `bc-${crumb.type}`]">{{ crumb.type }}</span>
            <span class="breadcrumb-message">
              {{ crumb.message }}
              <span v-if="crumb.count && crumb.count > 1" class="breadcrumb-count">&times;{{ crumb.count }}</span>
            </span>
            <span class="breadcrumb-time">{{ formatBreadcrumbTime(crumb.timestamp) }}</span>
          </div>
        </div>
      </section>

      <!-- Event timeline -->
      <section class="detail-section">
        <h3>Events ({{ group.count }})</h3>
        <div v-if="loading" class="events-loading">
          <div class="spinner" />
        </div>
        <p v-else-if="events.length === 0" class="events-empty">Geen individuele events gevonden</p>
        <div v-else class="event-list">
          <div class="event-header-row">
            <span>Tijd</span>
            <span>Sessie</span>
            <span>Browser</span>
            <span>Context</span>
            <span>URL</span>
          </div>
          <div v-for="event in events" :key="event.id" class="event-row">
            <span class="event-time">{{ formatTimestamp(event.created_at) }}</span>
            <span class="event-session">{{ event.session_id?.slice(0, 8) ?? '-' }}</span>
            <span class="event-browser">{{ (event.detail as Record<string, unknown>)?.browser ?? '-' }}</span>
            <span class="event-context">{{ (event.detail as Record<string, unknown>)?.context ?? '-' }}</span>
            <span class="event-url">{{ event.url ?? '-' }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.log-detail {
  max-width: 900px;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-outline);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.back-btn:hover {
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container);
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: 1px solid var(--md-sys-color-outline-variant);
  padding: var(--spacing-xs) var(--spacing-sm);
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-outline);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.export-btn:hover {
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container);
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.resolution-info {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-outline);
  font-weight: 500;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font: var(--md-sys-typescale-body-small);
  font-weight: 500;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-surface-container-lowest);
  cursor: pointer;
  transition: background var(--motion-duration-short) var(--motion-easing-standard);
}

.action-btn:hover:not(:disabled) {
  background: var(--md-sys-color-surface-container);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-resolve {
  color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.action-suppress {
  color: var(--md-sys-color-outline);
}

.resolve-input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.resolve-version-input {
  width: 140px;
  padding: var(--spacing-xs) var(--spacing-sm);
  font: var(--md-sys-typescale-body-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-surface-container-lowest);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

h2 {
  font: var(--md-sys-typescale-title-large);
  word-break: break-word;
}

.level-badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px var(--spacing-xs);
  border-radius: var(--md-sys-shape-corner-extra-small);
  flex-shrink: 0;
  margin-top: 3px;
}

.badge-error { background: var(--md-sys-color-error-container); color: var(--md-sys-color-error); }
.badge-warn { background: var(--md-sys-color-warning-container); color: var(--md-sys-color-on-warning-container); }

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  margin-bottom: var(--spacing-lg);
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--md-sys-color-outline);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font: var(--md-sys-typescale-body-small);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  font-variant-numeric: tabular-nums;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-section {
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  padding: var(--spacing-lg);
}

h3 {
  font: var(--md-sys-typescale-title-small);
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: var(--spacing-md);
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.context-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.context-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--md-sys-color-outline);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.context-value {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface);
  word-break: break-word;
}

.context-value.code {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  font-size: 0.75rem;
}

.env-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  margin-left: var(--spacing-xs);
  vertical-align: middle;
}

.env-dev {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.env-prod {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-primary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.events-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}

.events-empty {
  color: var(--md-sys-color-outline);
  font: var(--md-sys-typescale-body-small);
  text-align: center;
  padding: var(--spacing-md);
}

.event-list {
  overflow-x: auto;
}

/* Breadcrumbs */
.breadcrumb-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.breadcrumb-row {
  display: grid;
  grid-template-columns: 70px 1fr 70px;
  gap: var(--spacing-sm);
  font: var(--md-sys-typescale-label-small);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
}

.breadcrumb-row:last-child {
  border-bottom: none;
}

.breadcrumb-type {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.bc-navigation { color: var(--md-sys-color-primary); }
.bc-click { color: var(--md-sys-color-primary); }
.bc-api { color: var(--md-sys-color-warning); }
.bc-log { color: var(--md-sys-color-outline); }

.breadcrumb-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-count {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--md-sys-color-outline);
  background: var(--md-sys-color-surface-container);
  padding: 0 4px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  margin-left: var(--spacing-xs);
}

.breadcrumb-time {
  font-variant-numeric: tabular-nums;
  color: var(--md-sys-color-outline);
  text-align: right;
}

/* Events table */
.event-header-row {
  display: grid;
  grid-template-columns: 140px 80px 100px 120px 1fr;
  gap: var(--spacing-sm);
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--md-sys-color-outline);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.event-row {
  display: grid;
  grid-template-columns: 140px 80px 100px 120px 1fr;
  gap: var(--spacing-sm);
  font: var(--md-sys-typescale-label-small);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
}

.event-row:last-child {
  border-bottom: none;
}

.event-time {
  font-variant-numeric: tabular-nums;
  color: var(--md-sys-color-on-surface);
}

.event-session, .event-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .detail-meta {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .detail-section {
    padding: var(--spacing-md);
  }

  .event-header-row, .event-row {
    grid-template-columns: 120px 60px 1fr;
  }

  .event-header-row span:nth-child(4),
  .event-header-row span:nth-child(5),
  .event-row span:nth-child(4),
  .event-row span:nth-child(5) {
    display: none;
  }
}
</style>
