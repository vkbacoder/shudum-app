import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('isDarkMode');
      if (storedTheme !== null) {
        setIsDarkMode(JSON.parse(storedTheme));
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const colors = {
    light: {
      background: '#F5F5F5',
      card: '#FFFFFF',
      text: '#1E1E1E',
      subText: '#888888',
      primary: '#9e61efff',
      border: '#E0E0E0',
      icon: '#1E1E1E',
      inputBackground: '#F9F9F9',
      danger: '#FF6347',
      success: '#4CAF50',
    },
    dark: {
      background: '#000000', // "white color to black" - interpreting as main background
      card: '#1E1E1E',
      text: '#FFFFFF',
      subText: '#AAAAAA',
      primary: '#4803a2ff', // Requested override
      border: '#333333',
      icon: '#FFFFFF',
      inputBackground: '#2C2C2C',
      danger: '#FF6347',
      success: '#4CAF50',
    }
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
