import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import PixelText from '../PixelText';
import { getVolume, isMuted, onMuteChange, onVolumeChange, playSound, setMuted, setVolume } from '../sound';
import { Checkbox, text } from '../ui';
import { win } from '../Win2000Dialog';

const TRACK = 160; // height of the slider's travel, in px
const THUMB = 18;

/** The little Volume popup that opens from the tray speaker: a vertical slider and a Mute box. */
export default function VolumeControl() {
  const [volume, setVolumeState] = useState(getVolume);
  const [muted, setMutedState] = useState(isMuted);
  useEffect(() => onVolumeChange(setVolumeState), []);
  useEffect(() => onMuteChange(setMutedState), []);

  // Top of the track is full volume, bottom is silent.
  const fromY = (y: number) => 1 - Math.min(TRACK, Math.max(0, y - THUMB / 2)) / TRACK;
  const startY = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        startY.current = e.nativeEvent.locationY;
        setVolume(fromY(startY.current));
      },
      onPanResponderMove: (_, g) => setVolume(fromY(startY.current + g.dy)),
      // Like Windows, a ding on release lets you hear the new level.
      onPanResponderRelease: () => playSound('info'),
    }),
  ).current;

  const thumbTop = (1 - volume) * TRACK;

  return (
    <View style={styles.popup}>
      <PixelText text="Volume" style={text.ui} />
      <View style={styles.slider} {...pan.panHandlers}>
        <View pointerEvents="none" style={styles.track} />
        <View pointerEvents="none" style={[styles.thumb, { top: thumbTop }]} />
      </View>
      <Checkbox label="Mute" checked={muted} onChange={setMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  popup: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: win.face,
    ...win.raised,
  },
  slider: {
    width: 44,
    height: TRACK + THUMB,
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    top: THUMB / 2,
    bottom: THUMB / 2,
    width: 6,
    ...win.sunken,
  },
  thumb: {
    position: 'absolute',
    width: 40,
    height: THUMB,
    backgroundColor: win.face,
    ...win.raised,
  },
});
