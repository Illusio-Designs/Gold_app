import { useEffect } from 'react';
import { useNavigation as useRNNavigation } from '@react-navigation/native';
import { useNavigation } from '../context/NavigationContext';

export const useNavigationLoader = () => {
  const navigation = useRNNavigation();
  const { showLoader, hideLoader } = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      // Show loader when navigation state changes
      if (e.data.state && e.data.state.routes) {
        const currentRoute = e.data.state.routes[e.data.state.index];
        const previousRoute = e.data.state.routes[e.data.state.index - 1];
        
        // Only show loader if we're actually navigating to a different route
        if (previousRoute && currentRoute.name !== previousRoute.name) {
          // Customize loader text based on destination
          let loaderText = 'Loading...';
          let duration = 2000; // Default 2 seconds
          
          switch (currentRoute.name) {
            case 'Product':
              loaderText = 'Loading Products...';
              duration = 2500;
              break;
            case 'ProductDetail':
              loaderText = 'Loading Product Details...';
              duration = 3000;
              break;
            case 'Search':
              loaderText = 'Loading Search...';
              duration = 2000;
              break;
            case 'Collection':
              loaderText = 'Loading Collection...';
              duration = 2500;
              break;
            case 'Cart':
              loaderText = 'Loading Cart...';
              duration = 2000;
              break;
            case 'Profile':
              loaderText = 'Loading Profile...';
              duration = 2000;
              break;
            case 'EditProfile':
              loaderText = 'Loading Edit Profile...';
              duration = 2000;
              break;
            case 'Orders':
              loaderText = 'Loading Orders...';
              duration = 2500;
              break;
            case 'Home':
              loaderText = 'Loading Home...';
              duration = 2000;
              break;
            default:
              loaderText = 'Loading...';
              duration = 2000;
          }
          
          showLoader(loaderText, duration);
        }
      }
    });

    return unsubscribe;
  }, [navigation, showLoader]);

  // Return navigation object with loader functionality
  return {
    ...navigation,
    navigateWithLoader: (name: string, params?: any) => {
      showLoader('Navigating...', 2000);
      navigation.navigate(name as never, params as never);
    },
    goBackWithLoader: () => {
      showLoader('Going Back...', 1500);
      navigation.goBack();
    },
  };
};
