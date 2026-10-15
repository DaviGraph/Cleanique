import React, { useState } from 'react';
import type { CartItem } from '../types';
import type { CartContextType } from './CartContextType';
import { CartContext } from './CartContextObject';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const addToCart = (
    itemData: Omit<CartItem, 'id' | 'quantity'> & { id?: string; quantity?: number }
  ): boolean => {
    if (itemData.isQuote || itemData.price === null || itemData.price === undefined) {
      showNotification('Quote services use the quote request form and cannot be added to cart.');
      return false;
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.itemId === itemData.itemId || i.name === itemData.name
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
          category: itemData.category || 'Residential',
          price: itemData.price,
          formattedPrice: itemData.formattedPrice,
          quantity: itemData.quantity || 1,
          isQuote: false,
          features: itemData.features,
          itemType: 'package',
        };
        showNotification(`Added to Cart: ${itemData.name}`);
        return [...prev, newItem];
      }
    });
    return true;
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

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalAmount,
    depositAmount,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    notification,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
