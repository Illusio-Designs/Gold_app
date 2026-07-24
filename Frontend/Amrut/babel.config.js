module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true
    }]
  ],
  env: {
    production: {
      // Strip console.* from release builds (keeps them in dev). Errors are
      // still surfaced via the app's error UI, not the console.
      plugins: [['transform-remove-console', { exclude: ['error'] }]],
    },
  },
};
