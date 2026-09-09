module.exports = function (api) {
  api.cache(true);
  return {
    // Path aliases (`@/*`) come from tsconfig `paths`, which Expo's Metro resolver
    // reads natively — no babel-plugin-module-resolver needed.
    presets: ['babel-preset-expo'],
    plugins: [
      // Must stay last (Reanimated 4 / worklets requirement).
      'react-native-worklets/plugin',
    ],
  };
};
