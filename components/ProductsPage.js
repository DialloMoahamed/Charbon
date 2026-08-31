"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, ChevronDown, ChevronRight, Package, Flame, Truck, Leaf, SlidersHorizontal, X } from "lucide-react";
import { formatFCFA } from "./ui";
import { SackIllustration } from "./illustrations";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import { CartDrawer, CheckoutModal, OrderConfirmModal } from "./CartWidgets";
import { useCart } from "../lib/useCart";
import { submitOrder } from "../lib/placeOrder";

const ICONS = { sack: Package, flame: Flame, truck: Truck, leaf: Leaf };
const CATEGORIES = ["Ménage", "Grillade", "Industriel", "Écologique"];
const SORTS = [
  { id: "popularite", label: "Popularité" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "nom", label: "Nom (A → Z)" },
];

export default function ProductsPage({ contactPhone, contactCity }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const [category, setCategory] = useState("Tous les produits");
  const [availability, setAvailability] = useState({ enStock: false, rupture: false });
  const [weights, setWeights] = useState([]);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sort, setSort] = useState("popularite");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { cartItems, cartCount, cartTotal, addToCart, setCartQty, clearCart, toast } = useCart(products);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const c = searchParams.get("categorie");
    if (c && CATEGORIES.includes(c)) setCategory(c);
  }, [searchParams]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 25000 };
    const prices = products.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  useEffect(() => {
    setMaxPrice(priceBounds.max);
  }, [priceBounds.max]);

  const availableWeights = useMemo(
    () => [...new Set(products.map((p) => p.weightKg))].sort((a, b) => a - b),
    [products]
  );

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "Tous les produits") list = list.filter((p) => p.category === category);
    if (availability.enStock && !availability.rupture) list = list.filter((p) => p.stock > 0);
    if (availability.rupture && !availability.enStock) list = list.filter((p) => p.stock === 0);
    if (weights.length > 0) list = list.filter((p) => weights.includes(p.weightKg));
    list = list.filter((p) => p.price <= maxPrice);

    const sorted = [...list];
    if (sort === "prix-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "prix-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "nom") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, category, availability, weights, maxPrice, sort]);

  function toggleWeight(w) {
    setWeights((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  }

  async function placeOrder(customer) {
    const data = await submitOrder(cartItems, customer);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    clearCart();
    setCheckoutOpen(false);
    setCartOpen(false);
    setConfirmedOrder(data);
  }

  const FiltersPanel = (
    <>
      <div>
        <h3 className="text-sm font-semibold text-void mb-3">Catégories</h3>
        <div className="flex flex-col gap-1">
          {["Tous les produits", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-left px-3 py-2 rounded-lg text-sm ${
                category === c ? "bg-paperdeep font-semibold text-void" : "text-sack hover:bg-paperdeep/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-paperdeep">
        <h3 className="text-sm font-semibold text-void mb-3">Filtres</h3>

        <p className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">Disponibilité</p>
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-sack">
            <input
              type="checkbox"
              className="accent-ember"
              checked={availability.enStock}
              onChange={(e) => setAvailability((a) => ({ ...a, enStock: e.target.checked }))}
            />
            En stock ({inStockCount})
          </label>
          <label className="flex items-center gap-2 text-sm text-sack">
            <input
              type="checkbox"
              className="accent-ember"
              checked={availability.rupture}
              onChange={(e) => setAvailability((a) => ({ ...a, rupture: e.target.checked }))}
            />
            Rupture ({outOfStockCount})
          </label>
        </div>

        <p className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">Poids</p>
        <div className="space-y-2 mb-4">
          {availableWeights.map((w) => (
            <label key={w} className="flex items-center gap-2 text-sm text-sack">
              <input type="checkbox" className="accent-ember" checked={weights.includes(w)} onChange={() => toggleWeight(w)} />
              {w} kg
            </label>
          ))}
        </div>

        <p className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">Prix</p>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-ember"
        />
        <div className="flex justify-between text-xs text-ash mt-1 mb-4">
          <span>{formatFCFA(priceBounds.min)}</span>
          <span>{formatFCFA(maxPrice)}</span>
        </div>

        <button
          onClick={() => setMobileFiltersOpen(false)}
          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-ember text-white"
        >
          Filtrer
        </button>
      </div>
    </>
  );

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg bg-void text-paper">
          {toast}
        </div>
      )}

      <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="produits" />

      <div className="px-6 py-8 md:px-14">
        <p className="text-sm text-ash mb-1">
          <a href="/" className="hover:text-void">Accueil</a> / <span className="text-void">Produits</span>
        </p>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="font-display text-3xl text-void">Produits</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1 px-3 py-2 rounded-lg border border-paperdeep bg-white text-sm font-medium text-sack"
            >
              <SlidersHorizontal size={14} /> Filtres
            </button>
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-paperdeep bg-white font-medium text-sm text-sack"
              >
                Trier par : {SORTS.find((s) => s.id === sort)?.label} <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-paperdeep bg-white shadow-lg z-20 overflow-hidden">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSort(s.id); setSortOpen(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm ${sort === s.id ? "bg-paperdeep font-semibold" : "hover:bg-paperdeep/60"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          <aside className="hidden lg:block">{FiltersPanel}</aside>

          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="relative w-full max-w-xs h-full bg-white p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-void">Filtres</h3>
                  <button onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
                </div>
                {FiltersPanel}
              </div>
            </div>
          )}

          <div>
            {loading ? (
              <p className="text-sm text-ash">Chargement du catalogue…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-ash">Aucun produit ne correspond à ces filtres.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((p) => {
                  const Icon = ICONS[p.icon] || Package;
                  const outOfStock = p.stock === 0;
                  return (
                    <div key={p.id} className="rounded-wuta overflow-hidden flex flex-col bg-white border border-paperdeep hover:shadow-lg transition">
                      <a href={`/produits/${p.id}`} className="aspect-square bg-paperdeep block">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <SackIllustration category={p.category} Icon={Icon} />
                        )}
                      </a>
                      <div className="p-4 flex flex-col flex-1">
                        <a href={`/produits/${p.id}`}>
                          <h3 className="text-sm font-semibold text-void hover:text-ember">{p.name}</h3>
                        </a>
                        <p className="text-xs text-ash mt-0.5">{p.category} – {p.weightKg} kg</p>
                        <p className="font-display text-lg mt-2 text-void">{formatFCFA(p.price)}</p>
                        <p className={`flex items-center gap-1.5 text-xs mt-1 ${outOfStock ? "text-emberdeep" : "text-leaf"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? "bg-emberdeep" : "bg-leaf"}`} />
                          {outOfStock ? "Rupture" : "En stock"}
                        </p>
                        <button
                          disabled={outOfStock}
                          onClick={() => addToCart(p)}
                          className={`mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
                            outOfStock
                              ? "border-paperdeep text-ash cursor-not-allowed"
                              : "border-ember text-ember hover:bg-ember hover:text-white transition"
                          }`}
                        >
                          <ShoppingCart size={15} /> Ajouter au panier
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
