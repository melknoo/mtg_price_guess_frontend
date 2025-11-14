import { useState, useEffect } from 'react';

/**
 * Custom Hook für LocalStorage
 * Synchronisiert State mit LocalStorage
 */
export const useLocalStorage = (key, initialValue) => {
  // State mit Wert aus localStorage oder initialValue initialisieren
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Wert in localStorage speichern wenn sich State ändert
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};