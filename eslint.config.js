import tseslint from 'typescript-eslint'
import security from 'eslint-plugin-security'
import pluginVue from 'eslint-plugin-vue'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  {
    ignores: ["dist/**", "packages/**/dist/**", "coverage/**"],
  },

  // Vue plugin provides vue-eslint-parser for .vue files
  ...pluginVue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],

  // TypeScript parser for .ts files only
  {
    files: ['src/**/*.ts', 'packages/**/*.ts', 'fixtures/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      sourceType: 'module'
    }
  },

  // TypeScript parser for script blocks inside .vue files
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module'
      }
    }
  },

  // Security + rules for all src files
  {
    files: ['src/**/*.{ts,vue}', 'packages/**/*.ts', 'fixtures/**/*.ts'],
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      'no-console': 'error',
      'security/detect-object-injection': 'off',
      // Static UA-parsing regexes, not user-controlled input
      'security/detect-unsafe-regex': 'off',
      // oxfmt handles formatting
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      // Allow self-closing preference to be handled by formatter
      'vue/html-self-closing': 'off',
      // Attribute order is a style preference — oxfmt handles
      'vue/attributes-order': 'off',
      'vue/html-closing-bracket-newline': 'off',
      // v-html requires inline proof that content has passed through sanitizer.
      'vue/no-v-html': 'error',
      // a11y — explicit role for non-interactive elements is sometimes required
      // for ARIA pattern (radiogroup, checkbox). We use it knowingly.
      'vuejs-accessibility/no-static-element-interactions': 'warn',
      'vuejs-accessibility/click-events-have-key-events': 'warn',
      'vuejs-accessibility/label-has-for': ['error', {
        required: { some: ['nesting', 'id'] }
      }],
      // We DO want this strict: media must have an alt or aria-hidden
      'vuejs-accessibility/alt-text': 'error',
      // Heading-has-content depends on Vue compile-time text — keep as warn
      'vuejs-accessibility/heading-has-content': 'warn'
    }
  },

  // Test file relaxations
  {
    files: ['**/*.test.ts'],
    rules: {
      'security/detect-non-literal-regexp': 'off'
    }
  },

  // Logger is the only production module allowed to touch browser console APIs.
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off'
    }
  },

  // Primitives — single-word names are intentional (Button, Card, Skeleton…)
  {
    files: ['src/components/primitives/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off'
    }
  },

  // Storybook stories — inline showcase-components zijn opzettelijk;
  // single-word import-namen voor primitives idem
  {
    files: ['src/stories/**/*.{ts,vue}'],
    rules: {
      'vue/one-component-per-file': 'off',
      'vue/multi-word-component-names': 'off'
    }
  }
]
