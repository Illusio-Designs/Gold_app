import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, radius, FONT, fontSize } from '../../theme/tokens';

type Status = 'ok' | 'info' | 'warn' | 'muted' | 'danger';

interface StatusPillProps {
  label: string;
  status?: Status;
}

const MAP: Record<Status, { bg: string; fg: string }> = {
  ok: { bg: colors.successBg, fg: colors.success },
  info: { bg: colors.infoBg, fg: colors.info },
  warn: { bg: colors.warnBg, fg: colors.warn },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  muted: { bg: colors.creamSoft, fg: colors.muted },
};

// Order / notification status badge (Delivered, Pending, Shipped…).
const StatusPill: React.FC<StatusPillProps> = ({ label, status = 'muted' }) => {
  const c = MAP[status] || MAP.muted;
  return <Text style={[styles.pill, { backgroundColor: c.bg, color: c.fg }]}>{label}</Text>;
};

// Convenience: map a free-text order status to a tone.
export function toneForStatus(raw?: string): Status {
  const s = (raw || '').toLowerCase();
  if (s.includes('deliver')) return 'ok';
  if (s.includes('ship') || s.includes('transit')) return 'info';
  if (s.includes('process') || s.includes('pend')) return 'warn';
  if (s.includes('cancel') || s.includes('reject')) return 'danger';
  return 'muted';
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    fontFamily: FONT,
    fontSize: fontSize.caption,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});

export default StatusPill;
