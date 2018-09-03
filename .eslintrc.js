module.exports = {
  extends: "@comocapital/eslint-config/node",
  rules: {
    // I use underscore for symbol prefixes
    'no-underscore-dangle': 'off',

    // Doesn't support child node_modules.
    'import/no-extraneous-dependencies': 'off',

    // Conflicts with Prettier
    'unicorn/number-literal-case': 'off',
  },
  overrides: {
    files: [ 'test/**/*.js' ],
    rules: {
      'import/no-unresolved': 'off'
    }
  }
}
