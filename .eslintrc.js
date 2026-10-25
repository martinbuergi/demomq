module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [
    {
      // service worker: `self` is the ServiceWorkerGlobalScope
      files: ['sw.js'],
      env: {
        browser: false,
        serviceworker: true,
      },
      rules: {
        'no-restricted-globals': 'off', // airbnb restricts `self`, the SW global
      },
    },
  ],
};
