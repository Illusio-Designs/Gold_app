import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Tracks the on-screen keyboard height. More reliable than KeyboardAvoidingView
// on Android 15 / edge-to-edge builds, where `adjustResize` doesn't push content
// up — we lift the sticky action bar by exactly this many pixels instead.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setHeight(e?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
