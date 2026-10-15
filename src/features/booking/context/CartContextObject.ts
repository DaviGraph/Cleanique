import { createContext } from 'react';
import type { CartContextType } from './CartContextType';

export const CartContext = createContext<CartContextType | undefined>(undefined);
