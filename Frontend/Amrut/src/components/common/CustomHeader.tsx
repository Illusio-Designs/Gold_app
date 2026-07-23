import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type RightAction = {
  icon: any;            // require(...) image source
  onPress: () => void;
  tint?: string;
};

interface CustomHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;          // hide the back arrow (e.g. tab root screens)
  rightActions?: RightAction[]; // optional icons on the right (search, cart…)
}

// H3 · Left title + gold accent — a consistent header for every page:
// white bar, back arrow + left-aligned Glorify title with a short gold
// underline, and optional action icons on the right.
const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  onBack,
  showBack = true,
  rightActions = [],
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack || (() => (navigation as any).goBack())}
            style={styles.backBtn}
          >
            <Image
              source={require('../../assets/img/common/backarrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <View style={{ flex: 1 }} />

        {rightActions.map((action, i) => (
          <TouchableOpacity key={i} onPress={action.onPress} style={styles.actionBtn}>
            <Image
              source={action.icon}
              style={[styles.actionIcon, action.tint ? { tintColor: action.tint } : null]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* short gold underline aligned under the title */}
      <View style={[styles.accent, { marginLeft: showBack ? 36 : 20 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingTop: 6,
    paddingBottom: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  backArrow: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  title: {
    color: '#5D0829',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  actionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  accent: {
    width: 44,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#C09E83',
    marginTop: 6,
  },
});

export default CustomHeader;
