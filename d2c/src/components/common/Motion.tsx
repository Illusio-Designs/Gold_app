import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * Motion — shared micro-animation & shimmer primitives for the Amrut apps.
 * Built on the RN Animated API (native driver) so it stays smooth without extra
 * heavy dependencies. Everything is tuned to the brand palette:
 *   base tan/ivory  #ECE0CF   ·  cream shimmer sweep  #FCE2BF   ·  maroon accents.
 */

const SHIMMER_BASE = '#ECE0CF';
const SHIMMER_HIGHLIGHT = 'rgba(252,226,191,0.95)'; // brand cream sweep

/* ---------------------------------------------------------------- Skeleton */

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** A single shimmering placeholder block in the brand cream/tan colours. */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 10,
  style,
}) => {
  const progress = useRef(new Animated.Value(-1)).current;
  const [boxW, setBoxW] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [-1, 1],
    outputRange: [-boxW, boxW],
  });

  return (
    <View
      onLayout={e => setBoxW(e.nativeEvent.layout.width)}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: radius,
          backgroundColor: SHIMMER_BASE,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {boxW > 0 && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={['rgba(252,226,191,0)', SHIMMER_HIGHLIGHT, 'rgba(252,226,191,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

/* ------------------------------------------------------- Skeleton presets */

const sk = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEE3D3',
    padding: 10,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE3D3',
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },
});

/** Placeholder that matches a product card (image + name + sub-label). */
export const ProductCardSkeleton: React.FC = () => (
  <View style={sk.card}>
    <Skeleton height={112} radius={12} />
    <Skeleton height={13} radius={6} width="72%" style={{ marginTop: 12 }} />
    <Skeleton height={10} radius={5} width="46%" style={{ marginTop: 8 }} />
  </View>
);

/** A 2-per-row grid of product-card placeholders. */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View style={sk.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </View>
);

/** A wide banner placeholder (slider / hero). */
export const BannerSkeleton: React.FC<{ height?: number }> = ({ height = 150 }) => (
  <Skeleton
    height={height}
    radius={18}
    style={{ marginHorizontal: 16, marginVertical: 8 }}
  />
);

/** A horizontal list-row placeholder (orders, cart items). */
export const ListRowSkeleton: React.FC = () => (
  <View style={sk.row}>
    <Skeleton width={58} height={58} radius={12} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Skeleton height={13} radius={6} width="65%" />
      <Skeleton height={10} radius={5} width="40%" style={{ marginTop: 8 }} />
      <Skeleton height={10} radius={5} width="52%" style={{ marginTop: 8 }} />
    </View>
  </View>
);

/** A stack of list-row placeholders. */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={{ marginTop: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <ListRowSkeleton key={i} />
    ))}
  </View>
);

/** Product-detail placeholder: big image + text lines. */
export const DetailSkeleton: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <Skeleton height={300} radius={0} />
    <View style={{ padding: 20 }}>
      <Skeleton height={20} radius={8} width="70%" />
      <Skeleton height={14} radius={6} width="40%" style={{ marginTop: 14 }} />
      <Skeleton height={12} radius={6} width="90%" style={{ marginTop: 18 }} />
      <Skeleton height={12} radius={6} width="82%" style={{ marginTop: 10 }} />
      <Skeleton height={12} radius={6} width="60%" style={{ marginTop: 10 }} />
    </View>
  </View>
);

/* -------------------------------------------------- PressableScale (tap) */

type PressableScaleProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  disabled?: boolean;
  hitSlop?: number;
};

/** Wraps its children with a subtle spring scale-down on press. */
export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  onLongPress,
  children,
  style,
  activeScale = 0.96,
  disabled,
  hitSlop,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => spring(activeScale)}
      onPressOut={() => spring(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

/* ---------------------------------------------------- FadeInSlide (mount) */

type FadeInSlideProps = {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/** Fades + slides its children up on mount. Use `delay` to stagger a list. */
export const FadeInSlide: React.FC<FadeInSlideProps> = ({
  children,
  delay = 0,
  offset = 14,
  duration = 380,
  style,
}) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay, duration]);

  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default {
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  BannerSkeleton,
  ListRowSkeleton,
  ListSkeleton,
  DetailSkeleton,
  PressableScale,
  FadeInSlide,
};
