import { useContext } from 'react';
import { CartContext } from '../context/CartContextObject';
import type { CartContextType } from '../context/CartContextType';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
