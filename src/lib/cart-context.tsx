"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type CartItem = {
  setId: string;
  slug: string;
  name: string;
  etrogType: string;
  price: number; // agorot, snapshot at add-time — re-validated server-side at checkout
  kind: "REGULAR" | "SPECIAL" | "ADDON";
  stockRemaining: number | null; // null = unlimited (regular sets)
  quantity: number;
};

const STORAGE_KEY = "arba-minim-cart";
const CHANGE_EVENT = "cart-changed";

let cartCache: CartItem[] = [];
let hydratedFromStorage = false;

function readFromStorage(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (hydratedFromStorage || typeof window === "undefined") return;
  hydratedFromStorage = true;
  cartCache = readFromStorage();
}

function commit(next: CartItem[]) {
  cartCache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): CartItem[] {
  ensureHydrated();
  return cartCache;
}

// Server (and the client's first hydration pass) never has localStorage —
// useSyncExternalStore renders this until mount, then swaps to getSnapshot
// with no hydration-mismatch warning. Must return a stable reference (not a
// fresh [] literal) or React treats every call as a "changed" snapshot.
const EMPTY_CART: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function capQuantity(item: Pick<CartItem, "stockRemaining">, qty: number) {
  if (item.stockRemaining == null) return Math.max(qty, 0);
  return Math.min(Math.max(qty, 0), Math.max(item.stockRemaining, 0));
}

function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
  const current = getSnapshot();
  const existing = current.find((i) => i.setId === item.setId);
  if (existing) {
    commit(
      current.map((i) =>
        i.setId === item.setId ? { ...i, quantity: capQuantity(i, i.quantity + quantity) } : i
      )
    );
  } else {
    commit([...current, { ...item, quantity: capQuantity(item, quantity) }]);
  }
}

function updateQuantity(setId: string, quantity: number) {
  const current = getSnapshot();
  if (quantity <= 0) {
    commit(current.filter((i) => i.setId !== setId));
  } else {
    commit(current.map((i) => (i.setId === setId ? { ...i, quantity: capQuantity(i, quantity) } : i)));
  }
}

function removeItem(setId: string) {
  commit(getSnapshot().filter((i) => i.setId !== setId));
}

function clear() {
  commit([]);
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: typeof addItem;
  updateQuantity: typeof updateQuantity;
  removeItem: typeof removeItem;
  clear: typeof clear;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value: CartContextValue = {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
