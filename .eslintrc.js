module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'on',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "react-hooks/exhaustive-deps": "off",
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        "args": "none",
        "ignoreRestSiblings": true,
        "varsIgnorePattern": "key"
      }
    ],
    "no-async-promise-executor": "off",
    "no-html-link-for-pages": "off",
    "@next/next/no-html-link-for-pages": "off"
  },
};
