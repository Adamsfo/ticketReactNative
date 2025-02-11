const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.alias = {
    'react-native-maps': './EmptyModule',
};

module.exports = defaultConfig;