import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '../DesktopIcons';
import PixelText from '../PixelText';
import { Lines, SunkenPanel, text } from '../ui';

// Help topics, with lines pre-broken to fit the reading pane.
const TOPICS: { title: string; lines: string[] }[] = [
  {
    title: 'Welcome to Windows 2000',
    lines: [
      'Windows 2000 Professional makes your computer',
      'easier to use, more reliable and more secure.',
      '',
      'Use the Start button to open programs, find files,',
      'change settings and get help.',
    ],
  },
  {
    title: 'Starting a program',
    lines: [
      '1. Click Start, and then point to Programs.',
      '2. Point to the folder that contains the program,',
      '   such as Accessories.',
      '3. Click the program.',
      '',
      'You can also click Start, click Run, type the',
      'program name (for example notepad or calc),',
      'and then click OK.',
    ],
  },
  {
    title: 'Working with windows',
    lines: [
      'Drag a window by its title bar to move it.',
      'Drag the bottom-right corner to resize it.',
      '',
      'Use the buttons at the top right of a window to',
      'minimize, maximize or close it. Double-click the',
      'title bar to maximize or restore.',
      '',
      'Each open window has a button on the taskbar.',
      'Click it to switch to that window.',
    ],
  },
  {
    title: 'Saving your work',
    lines: [
      'In Notepad, click File, then Save. Files are saved',
      'in your My Documents folder.',
      '',
      'To see your files, click Start, point to Documents,',
      'and then click My Documents.',
    ],
  },
  {
    title: 'Changing your password',
    lines: [
      '1. Click Start, point to Settings, and then click',
      '   Control Panel.',
      '2. Double-click Users and Passwords.',
      '3. Click Set Password, type your old and new',
      '   passwords, and then click OK.',
    ],
  },
  {
    title: 'Shutting down',
    lines: [
      'Click Start, and then click Shut Down.',
      '',
      'Choose Log off to end your session, Restart to',
      'start Windows again, or Shut down to turn off',
      'the computer safely.',
    ],
  },
];

export default function HelpApp() {
  const [topic, setTopic] = useState(0);
  return (
    <View style={styles.root}>
      <SunkenPanel style={styles.contents}>
        <ScrollView>
          {TOPICS.map((t, i) => (
            <Pressable key={t.title} onPress={() => setTopic(i)} style={[styles.topic, i === topic && styles.topicSel]}>
              <Icon name="help" size={32} />
              <PixelText text={t.title} style={[text.ui, { fontSize: 18 }, i === topic && { color: '#fff' }]} />
            </Pressable>
          ))}
        </ScrollView>
      </SunkenPanel>
      <SunkenPanel style={styles.page}>
        <ScrollView contentContainerStyle={styles.pageBody}>
          <PixelText text={TOPICS[topic].title} style={[text.bold, styles.heading]} />
          <Lines lines={TOPICS[topic].lines} />
        </ScrollView>
      </SunkenPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 4,
  },
  contents: {
    width: 300,
  },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    height: 38,
  },
  topicSel: {
    backgroundColor: '#0a246a',
  },
  page: {
    flex: 1,
  },
  pageBody: {
    padding: 18,
    gap: 14,
  },
  heading: {
    fontSize: 26,
    color: '#0a246a',
  },
});
