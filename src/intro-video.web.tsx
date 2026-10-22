import { Asset } from 'expo-asset';
import { getAssetByID } from '@react-native/assets-registry/registry';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from './theme';

const INTRO = require('../assets/intro-mobile.mp4');
const PLAY_MS = 4000;
const FALLBACK_MS = 10000;

function absoluteUri(uri: string) {
  if (!uri) return '';
  if (uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('blob:') || uri.startsWith('file:')) {
    return uri;
  }
  if (typeof window === 'undefined') return uri;
  return new URL(uri, window.location.origin).toString();
}

function introUri() {
  if (typeof INTRO === 'string') return absoluteUri(INTRO);
  if (INTRO && typeof INTRO === 'object' && typeof (INTRO as { uri?: string }).uri === 'string') {
    return absoluteUri((INTRO as { uri: string }).uri);
  }
  if (typeof INTRO === 'number') {
    const registered = getAssetByID(INTRO);
    if (registered?.httpServerLocation && registered.name) {
      const type = registered.type ? `.${registered.type}` : '';
      return absoluteUri(`${registered.httpServerLocation}/${registered.name}${type}`);
    }
    const asset = Asset.fromModule(INTRO);
    return absoluteUri(asset.uri || asset.localUri || '');
  }
  return '';
}

export function IntroVideo({ onFinished }: { onFinished: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const done = useRef(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  function finish() {
    if (done.current) return;
    done.current = true;
    if (playTimer.current) clearTimeout(playTimer.current);
    videoRef.current?.pause();
    onFinishedRef.current();
  }

  useEffect(() => {
    const node = videoRef.current;
    const uri = introUri();
    if (!node || !uri) {
      const timer = setTimeout(finish, 300);
      return () => clearTimeout(timer);
    }

    node.muted = true;
    node.defaultMuted = true;
    node.playsInline = true;
    node.setAttribute('playsinline', 'true');
    node.setAttribute('muted', 'true');
    node.src = uri;
    node.load();

    const startClock = () => {
      if (playTimer.current || done.current) return;
      playTimer.current = setTimeout(finish, PLAY_MS);
    };

    const tryPlay = () => {
      node.play().then(startClock).catch(() => {});
    };

    node.addEventListener('playing', startClock);
    node.addEventListener('canplay', tryPlay);
    tryPlay();

    const fallback = setTimeout(finish, FALLBACK_MS);
    return () => {
      node.removeEventListener('playing', startClock);
      node.removeEventListener('canplay', tryPlay);
      clearTimeout(fallback);
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, []);

  return (
    <View style={styles.wrap}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: colors.navyDark,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
