// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow importing drizzle .sql migration files if drizzle-kit generate is used.
config.resolver.sourceExts.push('sql');

module.exports = config;
