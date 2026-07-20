import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as customerApi from "../lib/customerApi";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  count: number;
  items: any[];
  setCount: (n: number) => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  count: 0,
  items: [],
  setCount: () => {},
  refresh: async () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { session } = useAuth();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);

  type CartItem = { cartItemQuantity?: number; quantity?: number; [key: string]: any };

  const refresh = useCallback(async () => {
    const token = session?.tokens?.accessToken;
    if (!token) {
      setCount(0);
      return;
    }
    const fetchedItems = await customerApi.getCartItems(token);
    if (!fetchedItems) {
      setCount(0);
      setItems([]);
      return;
    }
    const arr = fetchedItems as CartItem[];
    const total = arr.reduce(
      (sum, item) => sum + (item.cartItemQuantity ?? item.quantity ?? 0),
      0,
    );
    setCount(total);
    setItems(arr);
  }, [session?.tokens?.accessToken]);

  useEffect(() => {
    const token = session?.tokens?.accessToken;
    if (token) {
      void refresh();
    } else {
      setCount(0);
    }
  }, [session?.tokens?.accessToken, refresh]);

  return (
    <CartContext.Provider value={{ count, items, setCount, refresh }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
