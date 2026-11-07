import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import PixelText from './PixelText';

import Win2000Dialog, { uiFont, win } from './Win2000Dialog';
import { useDiskBusy } from './sound';

type Message = { text: string; ms: number };

type Props = {
  onComplete: () => void;
  /** Status messages shown in order. Defaults to the startup sequence. */
  messages?: Message[];
  /** Show an empty blue screen for 2-5s before the dialog (startup only). */
  blankFirst?: boolean;
};

// Startup status messages, in order, with how long each stays up.
const STARTUP_MESSAGES: Message[] = [
  { text: 'Windows is starting up...', ms: 3000 },
  { text: 'Preparing network connections...', ms: 3500 },
];
const BLANK_MIN_MS = 2000; // empty blue screen shows for 2-5s before the dialog
const BLANK_MAX_MS = 5000;

export default function PleaseWaitScreen({
  onComplete,
  messages = STARTUP_MESSAGES,
  blankFirst = true,
}: Props) {
  useDiskBusy();
  const [blankMs] = useState(
    () => BLANK_MIN_MS + Math.random() * (BLANK_MAX_MS - BLANK_MIN_MS),
  );
  const [showDialog, setShowDialog] = useState(!blankFirst);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!showDialog) {
      const t = setTimeout(() => setShowDialog(true), blankMs);
      return () => clearTimeout(t);
    }
    const isLast = messageIndex >= messages.length - 1;
    const t = setTimeout(
      isLast ? onComplete : () => setMessageIndex((i) => i + 1),
      messages[messageIndex].ms,
    );
    return () => clearTimeout(t);
  }, [showDialog, blankMs, messageIndex, messages, onComplete]);


  return (
    <View style={styles.desktop}>
      {showDialog && (
        <Win2000Dialog title="Please wait...">
          <View style={styles.body}>
            <PixelText text={messages[messageIndex].text} style={styles.message} />
          </View>
        </Win2000Dialog>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    backgroundColor: win.desktop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    height: 90,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    fontFamily: uiFont,
    fontSize: 22,
    color: '#000',
  },
});
