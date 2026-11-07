import { StyleSheet, View } from 'react-native';

import type { AppProps } from '../desktop/types';
import { T } from '../ui';

// Native fallback: Paint draws on an HTML canvas, so it only works on the web.
export default function Paint(_props: AppProps) {
  return (
    <View style={styles.root}>
      <T>Paint is only available in the web version.</T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
