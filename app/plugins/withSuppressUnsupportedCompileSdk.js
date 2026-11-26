const { withGradleProperties } = require('@expo/config-plugins');

const KEY = 'android.suppressUnsupportedCompileSdk';
const VALUE = '36';

// React Native 0.76 pins AGP 8.6.0, which warns (and still builds) on compileSdk 36.
// expo-build-properties does not write this key, so keep it across prebuild here.
function withSuppressUnsupportedCompileSdk(config) {
  return withGradleProperties(config, (mod) => {
    const items = mod.modResults;
    const existing = items.find((item) => item.type === 'property' && item.key === KEY);
    if (existing) {
      existing.value = VALUE;
    } else {
      items.push({ type: 'property', key: KEY, value: VALUE });
    }
    return mod;
  });
}

module.exports = withSuppressUnsupportedCompileSdk;
