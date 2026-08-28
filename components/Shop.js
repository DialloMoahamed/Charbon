"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ShoppingCart, Plus, Minus, X, Check, Flame, Truck, Phone, MapPin,
  Package, Leaf, Menu, Lock,
} from "lucide-react";
import { Badge, StockGauge, formatFCFA, CATEGORY_COLORS } from "./ui";
import { SackIllustration, HeroIllustration } from "./illustrations";

// Leaflet a besoin de `window` : on ne le charge jamais côté serveur.
const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

const ICONS = { sack: Package, flame: Flame, truck: Truck, leaf: Leaf };
const CATEGORIES = ["Tous", "Ménage", "Grillade", "Industriel", "Écologique"];
const CART_KEY = "wuta_cart_v1";

export default function Shop({ contactPhone, contactCity }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [toast, setToast] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));

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
    products.forEach((p) => (m[p.id] = p));
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

  const filteredProducts =
    categoryFilter === "Tous" ? products : products.filter((p) => p.category === categoryFilter);

  async function placeOrder(customer) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        note: customer.note,
        latitude: customer.latitude,
        longitude: customer.longitude,
        items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Impossible d'enregistrer la commande.");
    }
    // Rafraîchit les stocks affichés après la commande.
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    setCart({});
    setCheckoutOpen(false);
    setCartOpen(false);
    setConfirmedOrder(data);
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg bg-void text-paper">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 md:px-10 bg-void border-b border-voidline">
        <div className="flex items-center gap-2">
          <Flame size={22} className="text-ember" />
          <span className="font-display text-xl tracking-tight text-paper">WUTA</span>
          <span className="hidden sm:inline text-xs font-mono text-ash">charbon &amp; braise</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-ashlight">
          <a href="#boutique" className="hover:text-white">Boutique</a>
          <a href="#comment" className="hover:text-white">Comment commander</a>
          <a href="#contact" className="hover:text-white">Contact</a>
          <a href="/admin" className="hover:text-white flex items-center gap-1">
            <Lock size={14} /> Espace pro
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-ember text-void font-semibold text-sm"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Panier</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-void text-paper font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 rounded-lg text-paper" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <Menu size={20} />
          </button>
        </div>
      </header>
      {mobileNavOpen && (
        <div className="md:hidden flex flex-col px-5 py-3 gap-3 text-sm bg-voidsoft text-ashlight">
          <a href="#boutique" onClick={() => setMobileNavOpen(false)}>Boutique</a>
          <a href="#comment" onClick={() => setMobileNavOpen(false)}>Comment commander</a>
          <a href="#contact" onClick={() => setMobileNavOpen(false)}>Contact</a>
          <a href="/admin">Espace pro</a>
        </div>
      )}

      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 py-16 md:py-24 md:px-14 bg-void"
        style={{ backgroundImage: "radial-gradient(ellipse at 30% 100%, rgba(192,67,42,0.15), #1B1512 65%)" }}
      >
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl order-2 md:order-1">
            <Badge className="bg-emberdeep">Livraison à {contactCity.split(",")[0]} sous 24h</Badge>
            <h1 className="font-display mt-5 text-4xl md:text-6xl leading-[1.05] text-paper font-semibold">
              Le feu qui tient toute la nuit.
            </h1>
            <p className="mt-5 text-base md:text-lg text-ashlight">
              Charbon de bois dur, braise pour grillades et charbon industriel, vendus au sac ou en gros.
              Commandez en ligne, payez à la livraison.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#boutique" className="px-6 py-3 rounded-lg font-semibold text-sm bg-ember text-void">
                Voir la boutique
              </a>
              <a href="#comment" className="px-6 py-3 rounded-lg font-semibold text-sm border border-voidline text-paper">
                Comment ça marche
              </a>
            </div>
          </div>
          <div className="order-1 md:order-2 h-56 md:h-80 -mx-6 md:mx-0">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-10 md:px-14 bg-paperdeep">
        {[
          { Icon: Truck, label: `Livraison ${contactCity}` },
          { Icon: Flame, label: "Bois dur, braise longue durée" },
          { Icon: Phone, label: "Paiement à la livraison" },
          { Icon: Leaf, label: "Gamme éco-charbon disponible" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-void text-ember">
              <Icon size={18} />
            </div>
            <span className="text-xs md:text-sm text-sack">{label}</span>
          </div>
        ))}
      </section>

      {/* Boutique */}
      <section id="boutique" className="px-6 py-16 md:px-14">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-ash">Catalogue</span>
            <h2 className="font-display text-3xl mt-1">Nos sacs de charbon</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  categoryFilter === c ? "bg-void text-paper border-void" : "text-sack border-paperdeep"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ash">Chargement du catalogue…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-ash">Aucun produit dans cette catégorie pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const Icon = ICONS[p.icon] || Package;
              const outOfStock = p.stock === 0;
              const lowStock = !outOfStock && p.stock / p.capacity < 0.2;
              return (
                <div key={p.id} className="rounded-2xl overflow-hidden flex flex-col bg-white border border-paperdeep hover:-translate-y-1 hover:shadow-xl transition">
                  <div className="h-40 bg-paperdeep">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <SackIllustration category={p.category} Icon={Icon} />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={CATEGORY_COLORS[p.category]}>{p.category}</Badge>
                      <span className="font-mono text-xs text-ash">{p.weightKg} kg</span>
                    </div>
                    <h3 className="font-display text-lg mt-3">{p.name}</h3>
                    <p className="text-sm mt-2 flex-1 text-sack">{p.description}</p>
                    <p className="text-xs mt-3 font-mono text-ash">Braise : {p.burnTime}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1 text-ash">
                        <span>Stock</span>
                        <span>{outOfStock ? "Rupture" : lowStock ? "Stock limité" : `${p.stock} disponibles`}</span>
                      </div>
                      <StockGauge stock={p.stock} capacity={p.capacity} />
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-display text-xl">{formatFCFA(p.price)}</span>
                      <button
                        disabled={outOfStock}
                        onClick={() => addToCart(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                          outOfStock ? "bg-paperdeep text-ash cursor-not-allowed" : "bg-void text-paper"
                        }`}
                      >
                        <Plus size={16} /> Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Comment commander */}
      <section id="comment" className="px-6 py-16 md:px-14 bg-paperdeep">
        <h2 className="font-display text-3xl mb-10">Comment commander</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "01", t: "Choisissez vos sacs", d: "Parcourez le catalogue et ajoutez vos formats au panier selon vos besoins." },
            { n: "02", t: "Validez la commande", d: "Indiquez votre nom, votre numéro et votre quartier de livraison." },
            { n: "03", t: "Recevez et payez", d: "Nos livreurs vous apportent la commande, vous payez à la réception." },
          ].map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-ember">{s.n}</span>
              <h3 className="font-display text-xl mt-2">{s.t}</h3>
              <p className="text-sm mt-2 text-sack">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="px-6 py-14 md:px-14 bg-void text-ashlight">
        <div className="flex flex-wrap justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-ember" />
              <span className="font-display text-lg text-paper">WUTA Charbon</span>
            </div>
            <p className="text-sm mt-3 max-w-xs">Vente de charbon de bois, braise et éco-charbon.</p>
          </div>
          <div className="text-sm space-y-2">
            <p className="flex items-center gap-2"><MapPin size={16} /> {contactCity}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {contactPhone}</p>
            <a href="/admin" className="flex items-center gap-2 opacity-70 hover:opacity-100">
              <Lock size={14} /> Espace pro
            </a>
          </div>
        </div>
      </footer>

      {/* Panier */}
      {cartOpen && !confirmedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md h-full flex flex-col bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-paperdeep">
              <h3 className="font-display text-xl">Votre panier</h3>
              <button onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartItems.length === 0 && <p className="text-sm text-ash">Votre panier est vide pour l'instant.</p>}
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-paperdeep">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs font-mono text-ash">{formatFCFA(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCartQty(item.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-paperdeep">
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button onClick={() => setCartQty(item.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-paperdeep">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="px-5 py-4 border-t border-paperdeep">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-ash">Total</span>
                  <span className="font-display text-xl">{formatFCFA(cartTotal)}</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  className="w-full py-3 rounded-lg font-semibold text-sm bg-void text-paper"
                >
                  Passer la commande
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <CheckoutModal total={cartTotal} onClose={() => setCheckoutOpen(false)} onSubmit={placeOrder} />
      )}

      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-sm w-full rounded-2xl p-8 text-center bg-white">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-leaf/20">
              <Check size={28} className="text-leaf" />
            </div>
            <h3 className="font-display text-2xl mt-4">Commande reçue</h3>
            <p className="text-sm mt-2 text-sack">
              Référence <span className="font-mono">{confirmedOrder.reference}</span>. Un livreur vous contactera bientôt.
            </p>
            <p className="font-display text-xl mt-4">{formatFCFA(confirmedOrder.total)}</p>
            <button
              onClick={() => setConfirmedOrder(null)}
              className="mt-6 w-full py-3 rounded-lg font-semibold text-sm bg-void text-paper"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutModal({ total, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Merci de renseigner votre nom, téléphone et adresse de livraison.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ name, phone, address, note, latitude, longitude });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-md w-full rounded-2xl p-6 bg-white max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Finaliser la commande</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nom complet" value={name} onChange={setName} placeholder="Ex : Aïcha Moussa" />
          <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="Ex : 90 00 00 00" />
          <Field label="Quartier / adresse" value={address} onChange={setAddress} placeholder="Ex : Plateau, rue NB-12" />
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
          />
          <Field label="Note (facultatif)" value={note} onChange={setNote} placeholder="Repère, horaire préféré…" />
          {error && <p className="text-xs text-emberdeep">{error}</p>}
        </div>
        <div className="flex items-center justify-between mt-5">
          <span className="text-sm text-ash">Total à payer à la livraison</span>
          <span className="font-display text-lg">{formatFCFA(total)}</span>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-4 py-3 rounded-lg font-semibold text-sm bg-ember text-void disabled:opacity-60"
        >
          {submitting ? "Envoi…" : "Confirmer la commande"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ash">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep"
      />
    </div>
  );
}
