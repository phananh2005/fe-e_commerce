import React, { createContext, useContext, useEffect, useState } from "react";
import * as customerApi from "../lib/customerApi";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  count: number;
  setCount: (n: number) => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  count: 0,
  setCount: () => {},
  refresh: async () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  type CartItem = { cartItemQuantity?: number; quantity?: number };

  const refresh = async () => {
    const token = session?.tokens?.accessToken;
    if (!token) {
      setCount(0);
      return;
    }
    const items = await customerApi.getCartItems(token);
    if (!items) {
      setCount(0);
      return;
    }
    const total = (items as CartItem[]).reduce(
      (sum, item) => sum + (item.cartItemQuantity ?? item.quantity ?? 0),
      0,
    );
    setCount(total);
  };

  useEffect(() => {
    const token = session?.tokens?.accessToken;
    if (token) {
      void refresh();
    } else {
      setCount(0);
    }
  }, [session?.tokens?.accessToken]);

  return (
    <CartContext.Provider value={{ count, setCount, refresh }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
