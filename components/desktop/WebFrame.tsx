import { View } from 'react-native';

import { Lines } from '../ui';

// Native fallback: real web pages are only shown in the web build.
export default function WebFrame({ url }: { url: string; onLoad?: () => void }) {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Lines lines={['This page can only be shown in the web version:', url]} />
    </View>
  );
}
