import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import BiosScreen from './components/BiosScreen';
import Desktop from './components/Desktop';
import type { PowerAction } from './components/desktop/types';
import LogOnScreen from './components/LogOnScreen';
import PixelText from './components/PixelText';
import PleaseWaitScreen from './components/PleaseWaitScreen';
import SplashScreen from './components/SplashScreen';
import StartingWindowsScreen from './components/StartingWindowsScreen';
import { SystemProvider } from './components/system';
import { text } from './components/ui';
import { playSound, preloadSounds, startMachine, stopMachine, unlockAudio } from './components/sound';

type Stage =
  | 'bios'
  | 'starting'
  | 'splash'
  | 'pleaseWait'
  | 'logon'
  | 'desktop'
  | 'loggingOff'
  | 'shuttingDown'
  | 'restarting'
  | 'off';

const LOG_OFF_MESSAGES = [{ text: 'Saving your settings...', ms: 2000 }];
const SHUT_DOWN_MESSAGES = [
  { text: 'Saving your settings...', ms: 1500 },
  { text: 'Windows is shutting down...', ms: 2500 },
];

export default function App() {
  // The machine starts switched off: browsers only allow sound after a click,
  // so pressing the power button is what lets the boot sounds play.
  const [stage, setStage] = useState<Stage>('off');

  useEffect(() => {
    if (stage === 'loggingOff') playSound('logoff');
    if (stage === 'shuttingDown' || stage === 'restarting') playSound('shutdown');
    if (stage === 'off') stopMachine();
  }, [stage]);
  const handleBiosComplete = useCallback(() => setStage('starting'), []);
  const handleStartingComplete = useCallback(() => setStage('splash'), []);
  const handleSplashComplete = useCallback(() => setStage('pleaseWait'), []);
  const toLogOn = useCallback(() => setStage('logon'), []);
  const toDesktop = useCallback(() => setStage('desktop'), []);
  const toOff = useCallback(() => setStage('off'), []);
  const toBios = useCallback(() => setStage('bios'), []);
  const powerOn = useCallback(() => {
    unlockAudio();
    preloadSounds();
    startMachine();
    setStage('bios');
  }, []);

  const handlePower = useCallback((action: PowerAction) => {
    setStage(action === 'logoff' ? 'loggingOff' : action === 'restart' ? 'restarting' : 'shuttingDown');
  }, []);

  return (
    <SystemProvider>
      <View style={styles.container}>
        {stage === 'bios' && <BiosScreen onComplete={handleBiosComplete} />}
        {stage === 'starting' && <StartingWindowsScreen onComplete={handleStartingComplete} />}
        {stage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {stage === 'pleaseWait' && <PleaseWaitScreen onComplete={toLogOn} />}
        {stage === 'logon' && <LogOnScreen onComplete={toDesktop} />}
        {stage === 'desktop' && <Desktop onPower={handlePower} />}
        {stage === 'loggingOff' && (
          <PleaseWaitScreen onComplete={toLogOn} messages={LOG_OFF_MESSAGES} blankFirst={false} />
        )}
        {stage === 'shuttingDown' && (
          <PleaseWaitScreen onComplete={toOff} messages={SHUT_DOWN_MESSAGES} blankFirst={false} />
        )}
        {stage === 'restarting' && (
          <PleaseWaitScreen onComplete={toBios} messages={SHUT_DOWN_MESSAGES} blankFirst={false} />
        )}
        {stage === 'off' && (
          // The machine is powered off; clicking presses the power button.
          <Pressable style={styles.off} onPress={powerOn}>
            <PixelText text="Click anywhere to turn the computer on." style={[text.ui, styles.offText]} />
          </Pressable>
        )}
        <StatusBar style="light" />
      </View>
    </SystemProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  off: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offText: {
    color: '#333',
  },
});
