import { type ReactNode, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Icon, type IconName } from '../DesktopIcons';
import PixelText from '../PixelText';
import { text, webCursor } from '../ui';
import { win } from '../Win2000Dialog';
import type { WindowState } from './types';

type Props = {
  state: WindowState;
  icon: IconName;
  active: boolean;
  resizable: boolean;
  /** Dialog-style windows only get a close button. */
  dialog: boolean;
  /** Desktop size, used for maximizing and keeping the title bar reachable. */
  bounds: { width: number; height: number };
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  children: ReactNode;
};

const MIN_W = 240;
const MIN_H = 140;
const DOUBLE_CLICK_MS = 400;

export default function WindowFrame(props: Props) {
  const { state, icon, active, resizable, dialog, bounds, zIndex } = props;

  // PanResponders are created once, so they read the latest props through a ref.
  const latest = useRef(props);
  latest.current = props;

  const drag = useRef({ x: 0, y: 0, w: 0, h: 0, lastGrant: 0 });

  const titlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const p = latest.current;
        p.onFocus();
        const now = Date.now();
        if (now - drag.current.lastGrant < DOUBLE_CLICK_MS && p.resizable && !p.dialog) {
          p.onToggleMaximize();
          drag.current.lastGrant = 0;
          return;
        }
        drag.current = { ...drag.current, x: p.state.x, y: p.state.y, lastGrant: now };
      },
      onPanResponderMove: (_, g) => {
        const p = latest.current;
        if (p.state.maximized) return;
        // Keep at least part of the title bar on screen.
        const x = Math.min(Math.max(drag.current.x + g.dx, 80 - p.state.w), p.bounds.width - 80);
        const y = Math.min(Math.max(drag.current.y + g.dy, 0), p.bounds.height - 40);
        p.onMove(x, y);
      },
    }),
  ).current;

  const resizePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const p = latest.current;
        p.onFocus();
        drag.current = { ...drag.current, w: p.state.w, h: p.state.h };
      },
      onPanResponderMove: (_, g) => {
        const p = latest.current;
        p.onResize(Math.max(MIN_W, drag.current.w + g.dx), Math.max(MIN_H, drag.current.h + g.dy));
      },
    }),
  ).current;

  const frame = state.maximized
    ? { left: 0, top: 0, width: bounds.width, height: bounds.height }
    : { left: state.x, top: state.y, width: state.w, height: state.h };

  return (
    <View
      style={[styles.window, frame, { zIndex }, state.minimized && styles.hidden]}
      // Any press inside the window brings it to the front, without stealing the press.
      onStartShouldSetResponderCapture={() => {
        if (!latest.current.active) latest.current.onFocus();
        return false;
      }}
    >
      <View style={styles.titleBar} {...titlePan.panHandlers}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="title-active" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#0a246a" />
              <Stop offset="1" stopColor="#a6caf0" />
            </LinearGradient>
            <LinearGradient id="title-inactive" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#808080" />
              <Stop offset="1" stopColor="#c0c0c0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%"
            fill={active ? 'url(#title-active)' : 'url(#title-inactive)'} />
        </Svg>
        {!dialog && <Icon name={icon} size={32} />}
        <View style={styles.titleTextWrap}>
          <PixelText text={state.title} style={[text.bold, styles.titleText, !active && styles.titleInactive]} />
        </View>
        <View style={styles.titleButtons}>
          {!dialog && (
            <>
              <TitleButton glyph="min" onPress={props.onMinimize} />
              <TitleButton glyph={state.maximized ? 'restore' : 'max'} onPress={props.onToggleMaximize}
                disabled={!resizable} />
            </>
          )}
          <View style={{ width: dialog ? 0 : 4 }} />
          <TitleButton glyph="close" onPress={props.onClose} />
        </View>
      </View>

      <View style={styles.body}>{props.children}</View>

      {resizable && !state.maximized && (
        <View style={styles.grip} {...resizePan.panHandlers}>
          <Svg width={24} height={24} viewBox="0 0 12 12">
            <Path d="M11,3 L3,11 M11,6 L6,11 M11,9 L9,11" stroke="#fff" strokeWidth={1} />
            <Path d="M11,4 L4,11 M11,7 L7,11 M11,10 L10,11" stroke="#808080" strokeWidth={1} />
          </Svg>
        </View>
      )}
    </View>
  );
}

type Glyph = 'min' | 'max' | 'restore' | 'close';

function TitleButton({ glyph, onPress, disabled }: { glyph: Glyph; onPress: () => void; disabled?: boolean }) {
  const color = disabled ? '#808080' : '#000';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.titleButton, pressed && !disabled ? win.sunken : win.raised]}
    >
      <Svg width={18} height={16} viewBox="0 0 9 8">
        {glyph === 'min' && <Rect x={1} y={6} width={6} height={2} fill={color} />}
        {glyph === 'max' && (
          <Path d="M0.5,0.5 h8 v7 h-8 z M0.5,1.5 h8" stroke={color} strokeWidth={1} fill="none" />
        )}
        {glyph === 'restore' && (
          <Path d="M2.5,0.5 h6 v5 h-2 M2.5,1.5 h6 M2.5,0.5 v2 M0.5,2.5 h6 v5 h-6 z M0.5,3.5 h6"
            stroke={color} strokeWidth={1} fill="none" />
        )}
        {glyph === 'close' && <Path d="M1,1 L8,7 M8,1 L1,7" stroke={color} strokeWidth={1.6} />}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  window: {
    position: 'absolute',
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  hidden: {
    display: 'none',
  },
  titleBar: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    gap: 6,
    overflow: 'hidden',
    ...webCursor('default'),
  },
  titleTextWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  titleText: {
    color: '#fff',
  },
  titleInactive: {
    color: '#d4d0c8',
  },
  titleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleButton: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: win.face,
  },
  body: {
    flex: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  grip: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    ...webCursor('nwse-resize'),
  },
});
