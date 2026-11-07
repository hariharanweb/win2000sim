import { StyleSheet, View } from 'react-native';

// Stripe under the Windows 2000 logo area: dark blue -> light blue -> dark blue.
const BAND_COLORS = [
  '#0a2a8a', '#0b2e90', '#0d3398', '#1040a8', '#1550b8', '#1c60c8',
  '#2470d4', '#2c78da', '#3078dc', '#2c74d8', '#2468cc', '#1c58bc',
  '#1448aa', '#0e3898', '#0a2c8c',
];

export default function BlueBand({ height = 22 }: { height?: number }) {
  return (
    <View style={[styles.band, { height }]}>
      {BAND_COLORS.map((c, i) => (
        <View key={i} style={[styles.slice, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  slice: {
    flex: 1,
  },
});
