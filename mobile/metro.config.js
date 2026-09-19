const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts ?? []), 'wav', 'mp3', 'm4a']),
);

module.exports = config;
