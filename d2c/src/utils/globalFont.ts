import React from 'react';
import { Text, TextInput } from 'react-native';

// Force the brand font (Glorify) on every Text / TextInput across the app.
//
// Glorify ships as a SINGLE weight (GlorifyDEMO.otf) with no bold file. On
// Android, `fontFamily: 'GlorifyDEMO'` + a bold `fontWeight` makes the OS look
// for a bold Glorify, fail, and fall back to the system font (Roboto) — which
// is why bold headings/buttons/active tabs looked "not Glorify". To guarantee
// Glorify everywhere we apply the font LAST (so it wins over any explicit
// fontFamily, including the stray Glorifydemo-BW3J3 / Montserrat) and normalise
// the weight so the single Glorify file is always used. Hierarchy is kept via
// font size, not weight.
const BRAND_FONT = { fontFamily: 'GlorifyDEMO', fontWeight: 'normal' as const };

function applyDefaultFont(Component: any) {
  const original = Component.render;
  if (!original || Component.__glorifyPatched) return;
  Component.render = function render(...args: any[]) {
    const element = original.apply(this, args);
    if (!element) return element;
    return React.cloneElement(element, {
      style: [element.props.style, BRAND_FONT],
    });
  };
  Component.__glorifyPatched = true;
}

applyDefaultFont(Text as any);
applyDefaultFont(TextInput as any);
