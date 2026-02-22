<script setup lang="ts">
const props = defineProps<{ stack: string }>()

interface StackFrame {
  raw: string
  isApp: boolean
  func: string | null
  file: string | null
  line: string | null
  col: string | null
}

function parseStack(raw: string): StackFrame[] {
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const trimmed = line.trim()
      const isFramework = /node_modules|vue\/runtime|@vue\//.test(trimmed)

      // V8: "at functionName (file:line:col)" or "at file:line:col"
      const v8 = trimmed.match(/^at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/)
      if (v8) {
        return {
          raw: trimmed,
          isApp: !isFramework,
          func: v8[1] ?? null,
          file: extractFile(v8[2]!),
          line: v8[3]!,
          col: v8[4]!
        }
      }

      // Safari: "functionName@file:line:col"
      const safari = trimmed.match(/^(.+?)@(.+?):(\d+):(\d+)$/)
      if (safari) {
        return {
          raw: trimmed,
          isApp: !isFramework,
          func: safari[1] ?? null,
          file: extractFile(safari[2]!),
          line: safari[3]!,
          col: safari[4]!
        }
      }

      return { raw: trimmed, isApp: !isFramework, func: null, file: null, line: null, col: null }
    })
}

function extractFile(path: string): string {
  const segments = path.split('/')
  return segments[segments.length - 1] ?? path
}

const frames = parseStack(props.stack)
</script>

<template>
  <div class="stack-trace">
    <div v-for="(frame, i) in frames" :key="i" :class="['frame', frame.isApp ? 'app-frame' : 'lib-frame']">
      <template v-if="frame.file">
        <span class="frame-at">at </span>
        <span v-if="frame.func" class="frame-func">{{ frame.func }} </span>
        <span class="frame-file">{{ frame.file }}</span>
        <span class="frame-loc">:{{ frame.line }}:{{ frame.col }}</span>
      </template>
      <template v-else>
        <span class="frame-raw">{{ frame.raw }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.stack-trace {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  padding: var(--spacing-sm) 0;
  overflow-x: auto;
}

.frame {
  padding: 1px var(--spacing-md);
  white-space: pre;
}

.app-frame {
  color: var(--md-sys-color-on-surface);
  font-weight: 500;
}

.lib-frame {
  color: var(--md-sys-color-outline);
  opacity: 0.6;
}

.frame-at {
  color: var(--md-sys-color-outline);
  font-weight: 400;
}

.frame-func {
  color: var(--md-sys-color-primary);
  margin-right: 0.5ch;
}

.frame-file {
  color: var(--md-sys-color-on-surface-variant);
}

.app-frame .frame-file {
  color: var(--md-sys-color-on-surface);
}

.frame-loc {
  color: var(--md-sys-color-outline);
}

.frame-raw {
  color: var(--md-sys-color-outline);
}
</style>
