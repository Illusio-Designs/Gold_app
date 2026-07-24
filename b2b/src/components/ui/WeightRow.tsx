import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, FONT, fontSize } from '../../theme/tokens';

interface WeightRowProps {
  gross?: string;
  less?: string;
  net?: string;
}

// The G.W / L.W / N.W strip used on cart items and product detail.
const cell = (label: string, value?: string, last?: boolean) => (
  <View style={[styles.cell, last && styles.lastCell]} key={label}>
    <Text style={styles.k}>{label}</Text>
    <Text style={styles.v}>{value || '—'}</Text>
  </View>
);

const WeightRow: React.FC<WeightRowProps> = ({ gross, less, net }) => (
  <View style={styles.row}>
    {cell('G.W', gross)}
    {cell('L.W', less)}
    {cell('N.W', net, true)}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  lastCell: { borderRightWidth: 0 },
  k: { fontFamily: FONT, fontSize: 9.5, color: colors.muted, marginBottom: 2 },
  v: { fontFamily: FONT, fontSize: fontSize.label, color: colors.maroon },
});

export default WeightRow;
