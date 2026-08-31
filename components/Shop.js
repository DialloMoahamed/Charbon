"use client";

import { useEffect, useState } from "react";
import {
  Plus, Flame, Truck, Phone, Leaf, Home, Factory, ChevronDown, Package,
} from "lucide-react";
import { Badge, StockGauge, formatFCFA, CATEGORY_COLORS } from "./ui";
import { SackIllustration, HeroIllustration } from "./illustrations";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import { CartDrawer, CheckoutModal, OrderConfirmModal } from "./CartWidgets";
import { useCart } from "../lib/useCart";
import { submitOrder } from "../lib/placeOrder";

const ICONS = { sack: Package, flame: Flame, truck: Truck, leaf: Leaf };
const CATEGORY_CARDS = [
  { name: "Ménage", Icon: Home, tone: "bg-sack", desc: "Charbon pour usage quotidien" },
  { name: "Grillade", Icon: Flame, tone: "bg-emberdeep", desc: "Idéal pour vos moments grillades" },
  { name: "Industriel", Icon: Factory, tone: "bg-steel", desc: "Pour restaurants, boulangeries, etc." },
  { name: "Écologique", Icon: Leaf, tone: "bg-leaf", desc: "Charbon écologique et durable" },
];

export default function Shop({ contactPhone, contactCity }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const { cartItems, cartCount, cartTotal, addToCart, setCartQty, clearCart, toast } = useCart(products);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).finally(() => setLoading(false));
  }, []);

  async function placeOrder(customer) {
    const data = await submitOrder(cartItems, customer);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    clearCart();
    setCheckoutOpen(false);
    setCartOpen(false);
    setConfirmedOrder(data);
  }

  const featured = products.slice(0, 6);

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg bg-void text-paper">
          {toast}
        </div>
      )}

      <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="accueil" />

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden px-6 py-14 md:py-20 md:px-14 bg-paper">
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl order-2 md:order-1">
            <Badge className="bg-ember/10 !text-ember">Du charbon de qualité</Badge>
            <h1 className="font-display mt-5 text-4xl md:text-6xl leading-[1.05] text-void">
              Livré chez vous.
            </h1>
            <p className="mt-5 text-base md:text-lg text-sack">
              Commandez facilement votre charbon et faites-vous livrer à domicile.
              Bois dur, braise pour grillades et charbon industriel, payés à la réception.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/produits" className="px-6 py-3 rounded-lg font-semibold text-sm bg-ember text-white shadow-sm shadow-ember/30">
                Commander maintenant
              </a>
              <a href="/produits" className="px-6 py-3 rounded-lg font-semibold text-sm border border-voidline text-void">
                Voir les produits
              </a>
            </div>
          </div>
          <div className="order-1 md:order-2 h-56 md:h-80 -mx-6 md:mx-0 rounded-wuta overflow-hidden bg-void">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-10 md:px-14 bg-paperdeep">
        {[
          { Icon: Truck, label: `Livraison rapide à ${contactCity.split(",")[0]}` },
          { Icon: Phone, label: "Paiement à la livraison" },
          { Icon: Flame, label: "Charbon de qualité sélectionné" },
          { Icon: Leaf, label: "Service client réactif" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white text-ember shadow-sm">
              <Icon size={18} />
            </div>
            <span className="text-xs md:text-sm text-sack">{label}</span>
          </div>
        ))}
      </section>

      {/* Catégories */}
      <section className="px-6 py-16 md:px-14">
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-ash">Explorer</span>
          <h2 className="font-display text-3xl mt-1 text-void">Nos catégories</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORY_CARDS.map(({ name, Icon, tone, desc }) => (
            <a
              key={name}
              href={`/produits?categorie=${encodeURIComponent(name)}`}
              className={`text-left rounded-wuta p-6 text-white ${tone} hover:-translate-y-1 transition block`}
            >
              <Icon size={22} />
              <h3 className="font-display text-lg mt-4">{name}</h3>
              <p className="text-sm mt-1 opacity-85">{desc}</p>
              <span className="inline-block text-xs font-semibold mt-4 underline underline-offset-2">
                Voir les produits →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Boutique (aperçu) */}
      <section id="boutique" className="px-6 py-16 md:px-14 bg-paperdeep/40">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-ash">Catalogue</span>
            <h2 className="font-display text-3xl mt-1 text-void">Nos sacs de charbon</h2>
          </div>
          <a href="/produits" className="flex items-center gap-1 px-4 py-2 rounded-lg border border-voidline text-sm font-semibold text-void">
            Voir tous les produits <ChevronDown size={14} className="-rotate-90" />
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-ash">Chargement du catalogue…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {featured.map((p) => {
              const Icon = ICONS[p.icon] || Package;
              const outOfStock = p.stock === 0;
              return (
                <div key={p.id} className="rounded-wuta overflow-hidden flex flex-col bg-white border border-paperdeep hover:-translate-y-1 hover:shadow-xl transition">
                  <a href={`/produits/${p.id}`} className="aspect-[4/3] bg-paperdeep block">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <SackIllustration category={p.category} Icon={Icon} />
                    )}
                  </a>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={CATEGORY_COLORS[p.category]}>{p.category}</Badge>
                      <span className="font-mono text-xs text-ash">{p.weightKg} kg</span>
                    </div>
                    <a href={`/produits/${p.id}`}>
                      <h3 className="font-display text-lg mt-3 text-void hover:text-ember">{p.name}</h3>
                    </a>
                    <p className="text-sm mt-2 flex-1 text-sack">{p.description}</p>
                    <div className="mt-4">
                      <StockGauge stock={p.stock} capacity={p.capacity} />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-display text-xl text-void">{formatFCFA(p.price)}</span>
                      <button
                        disabled={outOfStock}
                        onClick={() => addToCart(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                          outOfStock ? "bg-paperdeep text-ash cursor-not-allowed" : "bg-ember text-white shadow-sm shadow-ember/30"
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
