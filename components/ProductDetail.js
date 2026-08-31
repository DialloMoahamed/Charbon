"use client";

import { useEffect, useState } from "react";
import { Plus, Minus, ShoppingCart, Truck, Phone, Package, Flame, Leaf } from "lucide-react";
import { Badge, StockGauge, formatFCFA, CATEGORY_COLORS } from "./ui";
import { SackIllustration } from "./illustrations";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import { CartDrawer, CheckoutModal, OrderConfirmModal } from "./CartWidgets";
import { useCart } from "../lib/useCart";
import { submitOrder } from "../lib/placeOrder";

const ICONS = { sack: Package, flame: Flame, truck: Truck, leaf: Leaf };

export default function ProductDetail({ productId, contactPhone, contactCity }) {
  const [product, setProduct] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const { cartItems, cartCount, cartTotal, addToCart, setCartQty, clearCart, toast, setToast } = useCart(siblings);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    fetch(`/api/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((p) => {
        setProduct(p);
        fetch("/api/products")
          .then((r) => r.json())
          .then((all) => setSiblings(all));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  async function placeOrder(customer) {
    const data = await submitOrder(cartItems, customer);
    setSiblings((prev) => prev); // le stock affiché sera à jour au prochain chargement
    clearCart();
    setCheckoutOpen(false);
    setCartOpen(false);
    setConfirmedOrder(data);
  }

  function handleAdd() {
    if (!product) return;
    for (let i = 0; i < qty; i++) addToCart(product);
  }

  if (loading) {
    return (
      <div>
        <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="produits" />
        <p className="px-6 py-16 md:px-14 text-sm text-ash">Chargement du produit…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div>
        <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="produits" />
        <div className="px-6 py-16 md:px-14 text-center">
          <p className="text-sm text-ash mb-4">Ce produit n'existe pas ou n'est plus disponible.</p>
          <a href="/produits" className="px-5 py-2.5 rounded-lg bg-ember text-white text-sm font-semibold">
            Retour au catalogue
          </a>
        </div>
      </div>
    );
  }

  const Icon = ICONS[product.icon] || Package;
  const outOfStock = product.stock === 0;
  const otherFormats = siblings.filter((p) => p.category === product.category && p.id !== product.id);

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg bg-void text-paper">
          {toast}
        </div>
      )}

      <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="produits" />

      <div className="px-6 py-8 md:px-14">
        <p className="text-sm text-ash mb-6">
          <a href="/" className="hover:text-void">Accueil</a> / <a href="/produits" className="hover:text-void">Produits</a> /{" "}
          <span className="text-void">{product.name}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Galerie */}
          <div className="aspect-square rounded-wuta overflow-hidden bg-paperdeep">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <SackIllustration category={product.category} Icon={Icon} />
            )}
          </div>

          {/* Détails */}
          <div>
            <Badge className={CATEGORY_COLORS[product.category]}>{product.category}</Badge>
            <h1 className="font-display text-3xl mt-3 text-void">{product.name}</h1>
            <p className="text-sm mt-1 text-ash">{product.weightKg} kg</p>

            <p className="text-sm mt-5 text-sack">{product.description}</p>
            {product.burnTime && <p className="text-xs mt-2 font-mono text-ash">Braise : {product.burnTime}</p>}

            {otherFormats.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ash mb-2">
                  Autres formats — {product.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherFormats.map((p) => (
                    <a
                      key={p.id}
                      href={`/produits/${p.id}`}
                      className="px-3 py-2 rounded-lg border border-paperdeep text-sm hover:border-ember"
                    >
                      <span className="font-medium">{p.weightKg} kg</span>
                      <span className="text-ash ml-1.5 font-mono text-xs">{formatFCFA(p.price)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-1 text-ash">
                <span>Stock</span>
                <span>{outOfStock ? "Rupture de stock" : `${product.stock} disponibles`}</span>
              </div>
              <StockGauge stock={product.stock} capacity={product.capacity} />
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="font-display text-3xl text-void">{formatFCFA(product.price)}</span>
              {!outOfStock && (
                <div className="flex items-center gap-2 border border-paperdeep rounded-lg px-2 py-1">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-paperdeep">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-paperdeep">
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>

            <button
              disabled={outOfStock}
              onClick={handleAdd}
              className={`mt-5 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm ${
                outOfStock ? "bg-paperdeep text-ash cursor-not-allowed" : "bg-ember text-white shadow-sm shadow-ember/30"
              }`}
            >
              <ShoppingCart size={17} /> Ajouter au panier
            </button>

            <div className="mt-8 space-y-3 pt-6 border-t border-paperdeep">
              <p className="flex items-center gap-2 text-sm text-sack">
                <Truck size={16} className="text-ember" /> Livraison rapide à {contactCity.split(",")[0]}
              </p>
              <p className="flex items-center gap-2 text-sm text-sack">
                <Phone size={16} className="text-ember" /> Paiement à la livraison
              </p>
            </div>
          </div>
        </div>
      </div>

      <StoreFooter contactPhone={contactPhone} contactCity={contactCity} />

      <CartDrawer
        open={cartOpen && !confirmedOrder}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onClose={() => setCartOpen(false)}
        onQtyChange={setCartQty}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      {checkoutOpen && (
        <CheckoutModal total={cartTotal} onClose={() => setCheckoutOpen(false)} onSubmit={placeOrder} />
      )}
      <OrderConfirmModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />
    </div>
  );
}
