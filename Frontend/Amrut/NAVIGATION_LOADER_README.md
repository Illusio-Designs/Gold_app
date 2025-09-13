# Navigation Loader Implementation

This document explains how to use the new navigation loader that shows during screen transitions with a longer duration.

## Features

- **Automatic Loading**: Shows automatically during screen navigation
- **Customizable Duration**: Configurable display time (default: 2 seconds)
- **Custom Text**: Different loading messages for different screens
- **Smooth Animations**: Fade in/out with scale effects
- **Progress Bar**: Visual progress indicator
- **Responsive Design**: Adapts to different screen sizes

## How It Works

The navigation loader is automatically triggered when:
1. Users navigate between screens
2. The navigation state changes
3. Manual trigger via `showLoader()` function

## Usage

### 1. Automatic Loading (Recommended)

The loader automatically appears during navigation with appropriate text and duration:

```typescript
// Navigate normally - loader shows automatically
navigation.navigate('Product');
```

### 2. Manual Loading

You can manually trigger the loader with custom text and duration:

```typescript
import { useNavigationLoader } from '../context/NavigationContext';

const MyScreen = () => {
  const { showLoader } = useNavigationLoader();
  
  const handleNavigation = () => {
    showLoader('Loading Products...', 3000); // 3 seconds
    navigation.navigate('Product');
  };
  
  return (
    <TouchableOpacity onPress={handleNavigation}>
      <Text>Go to Products</Text>
    </TouchableOpacity>
  );
};
```

### 3. Custom Duration Examples

```typescript
// Quick loading (1.5 seconds)
showLoader('Loading...', 1500);

// Standard loading (2 seconds) - default
showLoader('Loading...', 2000);

// Extended loading (3+ seconds) - for complex screens
showLoader('Loading Product Details...', 3500);
```

## Screen-Specific Loading

The system automatically provides appropriate loading text for different screens:

- **Product**: "Loading Products..." (2.5s)
- **ProductDetail**: "Loading Product Details..." (3s)
- **Search**: "Loading Search..." (2s)
- **Collection**: "Loading Collection..." (2.5s)
- **Cart**: "Loading Cart..." (2s)
- **Profile**: "Loading Profile..." (2s)
- **EditProfile**: "Loading Edit Profile..." (2s)
- **Orders**: "Loading Orders..." (2.5s)
- **Home**: "Loading Home..." (2s)

## Customization

### Changing Default Duration

Modify the default duration in `NavigationContext.tsx`:

```typescript
const [loaderDuration, setLoaderDuration] = useState(3000); // 3 seconds default
```

### Adding New Screen Types

Add new screen types in `useNavigationLoader.ts`:

```typescript
case 'NewScreen':
  loaderText = 'Loading New Screen...';
  duration = 2500;
  break;
```

### Styling

Customize the loader appearance in `NavigationLoader.tsx`:

```typescript
// Change colors
backgroundColor: 'rgba(255, 255, 255, 0.95)',
color: '#5D0829',

// Change animation timing
duration: 300, // milliseconds
```

## Technical Details

### Components

- **NavigationLoader**: Main loader component with animations
- **NavigationContext**: Context provider for loader state
- **useNavigationLoader**: Hook for manual loader control

### Animation Properties

- **Fade In/Out**: 300ms timing
- **Scale**: Spring animation with tension: 50, friction: 7
- **Z-Index**: 9999 (above all other content)

### Performance

- Uses `useNativeDriver: true` for smooth animations
- Minimal re-renders with proper dependency arrays
- Automatic cleanup on unmount

## Troubleshooting

### Loader Not Showing

1. Check if `NavigationProvider` wraps your navigation
2. Verify `NavigationLoader` is included in `StackNavigation`
3. Ensure proper import paths

### Loader Stuck

1. Check for navigation state conflicts
2. Verify cleanup functions are working
3. Check console for errors

### Performance Issues

1. Reduce animation duration if needed
2. Check for memory leaks in navigation listeners
3. Optimize screen components

## Example Implementation

See `Profile.tsx` for a complete example of manual loader usage:

```typescript
<TouchableOpacity 
  onPress={() => {
    showLoader('Loading Edit Profile...', 2000);
    navigation.navigate('EditProfile');
  }}
>
  <Text>Edit Profile</Text>
</TouchableOpacity>
```

This implementation provides a smooth, professional loading experience that enhances user perception of app performance during navigation.
