const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add alias configuration for @ imports
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Keep these extensions (they're safe)
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp'
];

// Keep source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'js',
  'jsx',
  'ts',
  'tsx',
  'json'
];

module.exports = config;