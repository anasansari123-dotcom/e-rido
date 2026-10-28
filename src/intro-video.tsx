import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from './theme';

const INTRO = require('../assets/intro-mobile.mp4');
const PLAY_MS = 4000;
const FALLBACK_MS = 10000;

export function IntroVideo({ onFinished }: { onFinished: () => void }) {
  const done = useRef(false);
  const started = useRef(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const player = useVideoPlayer(INTRO, (instance) => {
    instance.muted = true;
    instance.loop = false;
  });

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (playTimer.current) clearTimeout(playTimer.current);
    try {
      player.pause();
    } catch {
      // Player may already be released.
    }
    onFinishedRef.current();
  }, [player]);

  function startClock() {
    if (started.current || done.current) return;
    started.current = true;
    playTimer.current = setTimeout(finish, PLAY_MS);
  }

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) startClock();
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    // Muted is already set when the player is created.
    if (status === 'readyToPlay') player.play();
    if (status === 'error') finish();
  });

  useEffect(() => {
    const playSoon = setTimeout(() => {
      player.muted = true;
      player.play();
    }, 80);
    const fallback = setTimeout(finish, FALLBACK_MS);
    return () => {
      clearTimeout(playSoon);
      clearTimeout(fallback);
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, [player, finish]);

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        contentPosition={{ dx: 0, dy: 0 }}
        nativeControls={false}
        playsInline
        pointerEvents="none"
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
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navyDark,
  },
});
