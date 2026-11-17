// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Bound memory use during local builds and OTA exports on development machines.
config.maxWorkers = 2;
// Local Gradle caches and emulator images live on D: beside the source. They
// must not enter Metro's file map, which otherwise consumes memory scanning them.
const priorBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(priorBlockList) ? priorBlockList : priorBlockList ? [priorBlockList] : []),
  ...['builds', '.audit', '.git', '.netlify', 'backup-backend', '.vscode'].map(folder =>
    new RegExp('^' + path.join(__dirname, folder).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[/\\\\]')),
];

// Allow importing drizzle .sql migration files if drizzle-kit generate is used.
config.resolver.sourceExts.push('sql');

module.exports = config;
