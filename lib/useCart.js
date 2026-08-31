"use client";

import { useEffect, useMemo, useState } from "react";

export const CART_KEY = "wuta_cart_v1";

/**
 * Panier partagé entre les pages (accueil, /produits, fiche produit).
 * Persisté en localStorage sous la même clé partout, donc il reste cohérent
 * quelle que soit la page sur laquelle le client navigue.
 */
export function useCart(products) {
  const [cart, setCart] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {
      /* stockage local indisponible, on continue sans panier persistant */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const productsById = useMemo(() => {
    const m = {};
    (products || []).forEach((p) => (m[p.id] = p));
    return m;
  }, [products]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([id, qty]) => qty > 0 && productsById[id])
        .map(([id, qty]) => ({ ...productsById[id], qty })),
    [cart, productsById]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  function addToCart(product) {
    const current = cart[product.id] || 0;
    const next = Math.min(product.stock, current + 1);
    if (next === current) {
      setToast(current >= product.stock ? "Stock maximum atteint" : "Rupture de stock");
      return;
    }
    setCart({ ...cart, [product.id]: next });
    setToast(`${product.name} ajouté au panier`);
  }

  function setCartQty(productId, qty) {
    const product = productsById[productId];
    const clamped = Math.max(0, Math.min(product ? product.stock : qty, qty));
    const next = { ...cart };
    if (clamped <= 0) delete next[productId];
    else next[productId] = clamped;
    setCart(next);
  }

  function clearCart() {
    setCart({});
  }

  return { cart, cartItems, cartCount, cartTotal, addToCart, setCartQty, clearCart, toast, setToast };
}
