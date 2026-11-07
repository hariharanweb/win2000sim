import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path, Polygon, Polyline } from 'react-native-svg';

import { MessageIcon } from './DesktopIcons';
import PixelText from './PixelText';
import { useSystem } from './system';
import { ClassicButton, Lines, PixelInput, text } from './ui';
import Win2000Dialog, { win } from './Win2000Dialog';

type Props = {
  onComplete: () => void;
};

// Line breaks are fixed (like the real dialog) since pixel text is drawn one line at a time.
const ERROR_LINES = [
  'The system could not log you on. Make sure your User name',
  'and domain are correct, then type your password again.',
  'Letters in passwords must be typed using the correct case.',
];

const HINT_LINES = ['User name: user', 'Password: password'];

export default function LogOnScreen({ onComplete }: Props) {
  const { settings } = useSystem();
  const [userName, setUserName] = useState(settings.userName);
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = () => {
    if (password === settings.password) {
      onComplete();
    } else {
      setShowError(true);
    }
  };

  const dismissError = () => {
    setShowError(false);
    setShowHint(true);
    setPassword('');
    passwordRef.current?.focus();
  };

  return (
    <View style={styles.desktop}>
      <Win2000Dialog title="Log On to Windows" showTagline>
        <View style={styles.body}>
          <View style={styles.row}>
            <PixelText text="User name:" style={[text.ui, styles.label]} />
            <PixelInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showError}
            />
          </View>
          <View style={[styles.row, styles.hintRow]}>
            <PixelText text="Password:" style={[text.ui, styles.label]} />
            <PixelInput
              style={styles.input}
              inputRef={passwordRef}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setShowHint(false);
              }}
              onSubmitEditing={submit}
              mask
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showError}
            />
            {showHint && <HintBalloon onClose={() => setShowHint(false)} />}
          </View>

          <View style={styles.buttons}>
            <ClassicButton label="OK" isDefault onPress={submit} disabled={showError} />
            <ClassicButton label="Cancel" onPress={() => setPassword('')} disabled={showError} />
          </View>
        </View>
      </Win2000Dialog>

      {showError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorDialog}>
            <View style={styles.errorTitleBar}>
              <PixelText text="Logon Message" style={[text.bold, { color: '#fff', fontSize: 18 }]} />
            </View>
            <View style={styles.errorBody}>
              <MessageIcon kind="error" />
              <Lines lines={ERROR_LINES} style={{ fontSize: 18 }} />
            </View>
            <View style={styles.errorButtons}>
              <ClassicButton label="OK" isDefault onPress={dismissError} autoFocus />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// A Windows 2000-style balloon tip: pale yellow, rounded, with a tail pointing up at the password box.
function HintBalloon({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.balloon} pointerEvents="box-none">
      <Svg width={26} height={20} style={styles.balloonTail}>
        <Polygon points="0,21 0,0 24,21" fill={BALLOON_FILL} />
        <Polyline points="0.5,21 0.5,0.5 24,21" fill="none" stroke="#000" strokeWidth={1} />
      </Svg>
      <View style={styles.balloonBox}>
        <View style={styles.balloonHeader}>
          <MessageIcon kind="info" size={28} />
          <PixelText text="Forgot your password?" style={[text.bold, { fontSize: 18 }]} />
          <Pressable onPress={onClose} style={styles.balloonClose} accessibilityLabel="Close">
            <Svg width={12} height={12} viewBox="0 0 12 12">
              <Path d="M2,2 L10,10 M10,2 L2,10" stroke="#000" strokeWidth={1.6} />
            </Svg>
          </Pressable>
        </View>
        <Lines lines={HINT_LINES} style={{ fontSize: 18 }} />
      </View>
    </View>
  );
}

const BALLOON_FILL = '#ffffe1';

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    backgroundColor: win.desktop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    width: 150,
  },
  input: {
    flex: 1,
    maxWidth: 500,
  },
  // Lift the password row above the buttons so the balloon can overlap them.
  hintRow: {
    zIndex: 10,
  },
  balloon: {
    position: 'absolute',
    top: '100%',
    left: 170,
    marginTop: 4,
  },
  balloonTail: {
    marginLeft: 24,
    marginBottom: -1, // sit over the box's top border so the tail joins seamlessly
    zIndex: 1,
  },
  balloonBox: {
    backgroundColor: BALLOON_FILL,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
  },
  balloonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balloonClose: {
    marginLeft: 'auto',
    paddingLeft: 16,
    padding: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 18,
    marginLeft: 150,
    maxWidth: 500,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDialog: {
    maxWidth: '96%',
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  errorTitleBar: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: '#0a246a',
  },
  errorBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    gap: 16,
  },
  errorButtons: {
    alignItems: 'center',
    paddingBottom: 14,
  },
});
