import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { resolveCategoryIcon } from '../../utils/categoryIcons';
import { colors, FONT, fontSize } from '../../theme/tokens';

export interface RailItem {
  id: number | string;
  name: string;
  icon?: string;
}

interface CategoryRailProps {
  items: RailItem[];
  activeId: number | string | null;
  onSelect: (id: number | string) => void;
}

const SCREEN_W = Dimensions.get('window').width;

// Swiggy-style horizontal icon tab rail. Active tab fills maroon and auto-scrolls
// into the centre of the rail whenever it changes (both directions).
const CategoryRail: React.FC<CategoryRailProps> = ({ items, activeId, onSelect }) => {
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, { x: number; w: number }>>({});

  useEffect(() => {
    if (activeId == null) return;
    const pos = layouts.current[String(activeId)];
    if (pos && scrollRef.current) {
      const target = Math.max(0, pos.x - SCREEN_W / 2 + pos.w / 2);
      scrollRef.current.scrollTo({ x: target, animated: true });
    }
  }, [activeId]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {items.map((item) => {
        const active = String(item.id) === String(activeId);
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => onSelect(item.id)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              layouts.current[String(item.id)] = { x, w: width };
            }}
            style={[styles.tab, active && styles.tabActive]}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <HugeiconsIcon
                icon={resolveCategoryIcon(item.icon)}
                size={25}
                color={active ? colors.cream : colors.goldDeep}
                strokeWidth={1.7}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  rail: { paddingHorizontal: 10, paddingTop: 12 },
  tab: {
    width: 64,
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 6,
    marginHorizontal: 2,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.transparent,
  },
  tabActive: { borderBottomColor: colors.maroon },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  label: { marginTop: 5, fontFamily: FONT, fontSize: fontSize.caption, color: colors.muted },
  labelActive: { color: colors.maroon },
});

export default CategoryRail;
