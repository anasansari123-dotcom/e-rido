// Restricted keys live in .env.local or EAS environment variables, never in git.
// Android key: "Android apps" restriction + Maps SDK for Android only.
// iOS key: "iOS apps" restriction (bundle id below) + Maps SDK for iOS only.
const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();

module.exports = ({ config }) => {
  const plugins = [
    ...(config.plugins ?? []),
    'expo-video',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow MTUK Nagar Ride to use your location for pickup, maps, and live ride coordination.',
      },
    ],
  ];

  if (androidMapsKey || iosMapsKey) {
    // Read keys inside the plugin so its options do not expose them in public app config.
    plugins.push('./plugins/with-google-maps');
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      androidGoogleMaps: Boolean(androidMapsKey),
      iosGoogleMaps: Boolean(iosMapsKey),
    },
  };
};
