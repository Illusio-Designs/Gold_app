import React from 'react';
import { Text, TextInput } from 'react-native';

// Apply the brand font (Glorify) as the default for every Text / TextInput
// across the whole app. The font is injected FIRST in the style array so any
// component that explicitly sets its own fontFamily still wins.
const BRAND_FONT = { fontFamily: 'GlorifyDEMO' };

function applyDefaultFont(Component: any) {
  const original = Component.render;
  if (!original || Component.__glorifyPatched) return;
  Component.render = function render(...args: any[]) {
    const element = original.apply(this, args);
    if (!element) return element;
    return React.cloneElement(element, {
      style: [BRAND_FONT, element.props.style],
    });
  };
  Component.__glorifyPatched = true;
}

applyDefaultFont(Text as any);
applyDefaultFont(TextInput as any);
