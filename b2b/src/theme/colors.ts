// Backward-compatible colors module. Keeps the original primary/secondary/accent
// (default export) and also exposes the full token palette as a named `colors`
// export, so both `import colors from` and `import { colors } from` work.
import { colors as palette } from './tokens';

const colors = {
  ...palette,
  primary: palette.maroon,
  secondary: palette.cream,
  accent: palette.gold,
};

export { colors };
export default colors;
