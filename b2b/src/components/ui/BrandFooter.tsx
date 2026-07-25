import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors, FONT } from '../../theme/tokens';

// End-of-list footer signature (Swiggy-style): a large muted brand wordmark and
// a "Crafted with ♥ by Finvera.Solutions" credit. The credit is tappable and
// opens the Finvera site in the browser.
const FINVERA_URL = 'https://finvera.solutions';

const BrandFooter: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.wrap, style]}>
    <Text style={styles.wordmark}>Amrutkumar Govardhandas LLP</Text>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => Linking.openURL(FINVERA_URL).catch(() => {})}
    >
      <Text style={styles.credit}>
        Crafted with <Text style={styles.heart}>♥</Text> by{' '}
        <Text style={styles.link}>Finvera.Solutions</Text>
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  wordmark: {
    fontFamily: FONT,
    fontSize: 27,
    lineHeight: 32,
    // muted, maroon-tinted grey — the screenshot's big faded wordmark, our palette
    color: '#D6C4CA',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  credit: {
    fontFamily: FONT,
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
  },
  // heart in our brand maroon (screenshot uses the brand accent for the heart)
  heart: { color: colors.maroon },
  link: { color: colors.maroon, textDecorationLine: 'underline' },
});

export default BrandFooter;
