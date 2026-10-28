const withMaps = require('react-native-maps/app.plugin.js').default;

module.exports = (config) =>
  withMaps(config, {
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim(),
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY?.trim(),
  });
