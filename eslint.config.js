import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginReact from 'eslint-plugin-react' // Import eslint-plugin-react

export default [
  { ignores: ['dist', 'ml-service/'] }, // Add ml-service/ to ignores
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react: eslintPluginReact,
    },
    settings: { // Add settings for react
      react: {
        version: '19.0.0', // Explicitly set React version
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...eslintPluginReact.configs.recommended.rules, // Add recommended rules for react
      'react-refresh/only-export-components': 'off', // Disable react-refresh/only-export-components
      'react/prop-types': 'off', // Disable react/prop-types
    },
  },
  {
    files: ['backend/**/*.js'], // Apply to all backend JavaScript files
    languageOptions: {
      globals: {
        ...globals.node, // Node.js globals
      },
    },
    rules: { // Add no-unused-vars here
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['backend/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-undef': 'off', // Temporarily turn off no-undef for Jest globals
    },
  },
  {
    files: ['k6/**/*.js'], // Apply to all k6 JavaScript files
    languageOptions: {
      globals: {
        ...globals.k6,
        process: 'readonly',
        __ENV: 'readonly', // Explicitly add __ENV as a global for k6 files
      },
    },
  },
  {
    files: ['src/**/*.{js,jsx}'], // Target frontend files
    rules: {
      'no-unused-vars': 'off', // Explicitly disable for frontend files
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
      'react/jsx-uses-react': 'off', // Not needed for React 17+ with new JSX transform
      'react-hooks/exhaustive-deps': 'off', // Explicitly disable for frontend files
    },
  },
]
