import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  calculateGrid: (count: number) => { columns: number; rows: number };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [windowDimensions, setWindowDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const width = windowDimensions.width;
  const height = windowDimensions.height;

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const calculateGrid = (count: number) => {
    if (count <= 1) return { columns: 1, rows: 1 };
    if (count === 2) {
      // No mobile portrait, 1 coluna x 2 linhas; no desktop, 2 colunas x 1 linha
      return isMobile && height > width ? { columns: 1, rows: 2 } : { columns: 2, rows: 1 };
    }
    if (count <= 4) return { columns: 2, rows: 2 };
    if (count <= 6) return { columns: 3, rows: 2 };
    if (count <= 9) return { columns: 3, rows: 3 };
    return { columns: 4, rows: Math.ceil(count / 4) };
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    calculateGrid,
  };
}
