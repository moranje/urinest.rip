import tseslint from 'typescript-eslint'
import security from 'eslint-plugin-security'
import pluginVue from 'eslint-plugin-vue'

export default [
  // Vue plugin provides vue-eslint-parser for .vue files
  ...pluginVue.configs['flat/recommended'],

  // TypeScript parser for .ts files only
  {
    files: ['src/**/*.ts'],
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
    files: ['src/**/*.{ts,vue}'],
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
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
      // v-html is used for trusted markdown content from our own data
      'vue/no-v-html': 'off'
    }
  },

  // Test file relaxations
  {
    files: ['**/*.test.ts'],
    rules: {
      'security/detect-non-literal-regexp': 'off'
    }
  }
]
