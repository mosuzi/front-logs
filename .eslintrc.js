// See https://eslint.org/docs/latest/rules/
// See https://github.com/prettier/eslint-plugin-prettier
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-trailing-spaces': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: true
      }
    ],
    indent: [
      'error',
      2,
      {
        VariableDeclarator: 'first',
        ObjectExpression: 'first'
      }
    ],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ]
  }
}
