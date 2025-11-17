# Login Prompt Modal - Usage Guide

## Overview
`LoginPromptModal` component ko use karo jab guest users restricted features access karne ki koshish karein (Cart, Orders, Profile, etc.).

## Files Created
1. **LoginPromptModal.tsx** - Modal component
2. **useLoginPrompt.ts** - Custom hook for easy integration

## How to Use

### Method 1: Using the Hook (Recommended)

```tsx
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';

const YourScreen = () => {
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();

  // Check on component mount
  useEffect(() => {
    checkAndPromptLogin();
  }, []);

  // Or check before specific action
  const handleProtectedAction = async () => {
    const isLoggedIn = await checkAndPromptLogin(() => {
      // This callback runs only if user is logged in
      console.log('User is logged in, proceed with action');
    });

    if (!isLoggedIn) {
      // User is not logged in, modal will be shown automatically
      return;
    }
  };

  return (
    <View>
      {/* Your screen content */}
      
      {/* Add modal at the end */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to access this feature"
      />
    </View>
  );
};
```

### Method 2: Manual State Management

```tsx
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginPromptModal from '../components/common/LoginPromptModal';

const YourScreen = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const checkLogin = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!userId || !token) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    checkLogin();
  }, []);

  return (
    <View>
      {/* Your screen content */}
      
      <LoginPromptModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Required"
        message="Please login to continue"
      />
    </View>
  );
};
```

## Props

### LoginPromptModal
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| visible | boolean | required | Controls modal visibility |
| onClose | function | required | Called when modal should close |
| title | string | 'Login Required' | Modal title |
| message | string | 'Please login to continue' | Modal message |

### useLoginPrompt Hook Returns
| Property | Type | Description |
|----------|------|-------------|
| isLoggedIn | boolean \| null | Current login status |
| showLoginPrompt | boolean | Whether to show modal |
| checkAndPromptLogin | function | Check login and show modal if needed |
| closeLoginPrompt | function | Close the modal |
| checkLoginStatus | function | Just check login status without showing modal |

## Screens Where to Add

### Required (Authentication Mandatory)
- ✅ **Cart.tsx** - Already added
- **Orders.tsx** - Add same implementation
- **Profile.tsx** / **EditProfile.tsx** - Add same implementation

### Optional (Add to Cart Action)
- **ProductDetail.tsx** - Show modal when guest user tries to add to cart
- **Product.tsx** - Show modal when guest user tries to add to cart from listing

## Example Implementation for Orders Screen

```tsx
import React, { useEffect } from 'react';
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';

const Orders = () => {
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();

  useEffect(() => {
    checkAndPromptLogin();
  }, []);

  return (
    <View>
      {/* Your orders screen content */}
      
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to view your orders"
      />
    </View>
  );
};
```

## Example Implementation for Add to Cart

```tsx
const handleAddToCart = async () => {
  const isLoggedIn = await checkAndPromptLogin(async () => {
    // This callback executes only if user is logged in
    await addToCart(product);
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.name} added to cart`
    });
  });

  // If not logged in, modal will be shown automatically
};
```

## Features

✅ Beautiful maroon theme matching app design
✅ Three action buttons:
   - **Login** - Navigate to login screen
   - **Create Account** - Navigate to register screen  
   - **Continue Browsing** - Close modal and continue as guest
✅ Responsive design for all screen sizes
✅ Custom font (Glorifydemo-BW3J3)
✅ Shadow and elevation effects
✅ Tap outside to close

## Customization

### Change Colors
Edit `LoginPromptModal.tsx` styles:
```tsx
backgroundColor: '#5D0829', // Primary button color
borderColor: '#5D0829',     // Border color
color: '#FCE2BF',           // Button text color
```

### Change Messages
Pass different props:
```tsx
<LoginPromptModal
  visible={showLoginPrompt}
  onClose={closeLoginPrompt}
  title="Oops! Login Needed"
  message="To place orders, you need to login first. It only takes a minute!"
/>
```

## Notes

- Modal automatically closes when user taps outside
- After login/register, user returns to previous screen (React Navigation handles this)
- Guest users can still browse products and collections without login
- Only protected features (Cart, Orders, Profile) require login
