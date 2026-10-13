import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'> & { id?: string; quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  depositAmount: number;
  hasQuoteItems: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  notification: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cleanique_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota error
    }
  }, [items]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const addToCart = (
    itemData: Omit<CartItem, 'id' | 'quantity'> & { id?: string; quantity?: number }
  ) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.itemId === itemData.itemId && i.name === itemData.name
      );

      if (existingIdx >= 0) {
        const next = [...prev];
        const addQty = itemData.quantity || 1;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + addQty,
        };
        showNotification(`Updated: ${itemData.name} (Qty: ${next[existingIdx].quantity})`);
        return next;
      } else {
        const newItem: CartItem = {
          id: itemData.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          itemId: itemData.itemId,
          name: itemData.name,
          category: itemData.category,
          price: itemData.price,
          formattedPrice: itemData.formattedPrice,
          quantity: itemData.quantity || 1,
          isQuote: itemData.isQuote,
          features: itemData.features,
          itemType: itemData.itemType,
        };
        showNotification(`Added to Cart: ${itemData.name}`);
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) {
        showNotification(`Removed: ${removed.name}`);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce((sum, item) => {
    if (item.price && !item.isQuote) {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  const depositAmount = Math.round(totalAmount * 0.5);

  const hasQuoteItems = items.some((item) => item.isQuote || item.price === null);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmount,
        depositAmount,
        hasQuoteItems,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        notification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
