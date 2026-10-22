// Restricted keys live in EAS environment variables, never in git.
// Android key: "Android apps" restriction + Maps SDK for Android only.
// iOS key: "iOS apps" restriction (bundle id below) + Maps SDK for iOS only.
const androidMapsKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY;

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
    plugins.push([
      'react-native-maps',
      {
        ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : null),
        ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : null),
      },
    ]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      iosGoogleMaps: Boolean(iosMapsKey),
    },
  };
};
