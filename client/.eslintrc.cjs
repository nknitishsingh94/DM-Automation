module.exports = {
  env: { browser: true, es2020: true },
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off'
  },
}
