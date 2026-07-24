import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, FONT, fontSize } from '../../theme/tokens';

export interface SpecRow {
  k: string;
  v: string;
}

interface SpecTableProps {
  rows: SpecRow[];
}

// Striped specifications table (size, purity, weights, SKU) for product detail.
const SpecTable: React.FC<SpecTableProps> = ({ rows }) => (
  <View style={styles.table}>
    {rows.map((r, i) => (
      <View
        key={r.k + i}
        style={[styles.row, i % 2 === 1 && styles.rowAlt, i === rows.length - 1 && styles.lastRow]}
      >
        <Text style={styles.k}>{r.k}</Text>
        <Text style={styles.v}>{r.v}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowAlt: { backgroundColor: colors.creamSoft },
  lastRow: { borderBottomWidth: 0 },
  k: { fontFamily: FONT, fontSize: fontSize.bodySm, color: colors.muted },
  v: { fontFamily: FONT, fontSize: fontSize.bodySm, color: colors.ink },
});

export default SpecTable;
