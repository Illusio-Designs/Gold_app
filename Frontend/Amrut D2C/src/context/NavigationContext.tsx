import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationContextType {
  showLoader: (text?: string, duration?: number) => void;
  hideLoader: () => void;
  isLoaderVisible: boolean;
  loaderText: string;
  loaderDuration: number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationLoader = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationLoader must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [loaderText, setLoaderText] = useState('Loading...');
  const [loaderDuration, setLoaderDuration] = useState(2000);

  const showLoader = useCallback((text: string = 'Loading...', duration: number = 2000) => {
    setLoaderText(text);
    setLoaderDuration(duration);
    setIsLoaderVisible(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoaderVisible(false);
  }, []);

  const value: NavigationContextType = {
    showLoader,
    hideLoader,
    isLoaderVisible,
    loaderText,
    loaderDuration,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
