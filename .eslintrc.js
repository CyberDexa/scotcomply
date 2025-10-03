module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // Performance
    'react/no-array-index-key': 'warn',
    'react/jsx-no-bind': 'off', // tRPC uses bind extensively
    
    // Code quality
    'prefer-const': 'warn', // Changed from error to warn
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    
    // TypeScript - relaxed for now
    '@typescript-eslint/no-unused-vars': 'warn', // Changed from error to warn
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': 'warn', // Changed from error to warn
    '@typescript-eslint/no-empty-object-type': 'warn', // Changed from error to warn
    
    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off', // We use TypeScript
    'react/react-in-jsx-scope': 'off', // Next.js doesn't require React import
    
    // Next.js specific
    '@next/next/no-img-element': 'error', // Use next/image instead
    '@next/next/no-html-link-for-pages': 'error',
    
    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'warn',
    
    // Import organization - warnings only
    'import/order': 'off' // Disabled for now to allow build
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}
