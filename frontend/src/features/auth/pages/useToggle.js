// Créez un nouveau fichier useToggle.js
import { useState, useCallback } from 'react';

export const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  
  const toggle = useCallback(() => setState(prev => !prev), []);
  const open = useCallback(() => setState(true), []);
  const close = useCallback(() => setState(false), []);
  
  return [state, toggle, open, close];
};