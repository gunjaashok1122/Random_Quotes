const { getDefaultConfig } = require("expo/metro-config");

let config = getDefaultConfig(__dirname);

try {
  const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
  config = withRorkMetro(config);
} catch (e) {
  // Rork SDK metro wrapper failed or not present, fallback to default
}

module.exports = config;
