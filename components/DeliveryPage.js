"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Truck, Phone, Clock, MapPin, Package } from "lucide-react";
import { Badge, formatFCFA } from "./ui";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import { CartDrawer, CheckoutModal, OrderConfirmModal } from "./CartWidgets";
import { useCart } from "../lib/useCart";
import { submitOrder } from "../lib/placeOrder";

const OrdersMap = dynamic(() => import("./OrdersMap"), { ssr: false });

const IDENTITY_KEY = "wuta_customer_v1";
const POLL_MS = 10000;

const STATUS_STYLE = {
  "En attente": "bg-ember",
  "Livrée": "bg-leaf",
  "Annulée": "bg-steel",
};

export default function DeliveryPage({ contactPhone, contactCity }) {
  const [products, setProducts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const { cartItems, cartCount, cartTotal, setCartQty, clearCart, toast } = useCart(products);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(IDENTITY_KEY);
      if (saved) setPhone(JSON.parse(saved).phone || "");
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!phone) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!cancelled) {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [phone]);

  async function placeOrder(customer) {
    const data = await submitOrder(cartItems, customer);
    clearCart();
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

      <StoreHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} active="livraison" />

      {/* Infos livraison */}
      <section className="px-6 py-14 md:px-14 bg-paper">
        <span className="text-xs font-mono uppercase tracking-widest text-ash">Livraison</span>
        <h1 className="font-display text-3xl md:text-4xl mt-1 text-void">Comment on vous livre</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {[
            { Icon: MapPin, title: "Zone desservie", desc: contactCity },
            { Icon: Clock, title: "Délai", desc: "Livraison rapide, généralement en moins de 24h" },
            { Icon: Phone, title: "Paiement", desc: "À la livraison, en espèces au livreur" },
            { Icon: Truck, title: "Suivi", desc: "Statut de commande visible ci-dessous" },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-wuta p-5 bg-white border border-paperdeep">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-ember/10 text-ember mb-3">
                <Icon size={18} />
              </div>
              <h3 className="font-display text-base text-void">{title}</h3>
              <p className="text-sm mt-1 text-sack">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            { n: "01", t: "Commande passée", d: "Vous validez votre panier avec votre nom, téléphone et adresse." },
            { n: "02", t: "Préparation", d: "Votre commande est préparée et confiée à un livreur." },
            { n: "03", t: "Livraison & paiement", d: "Le livreur vous l'apporte, vous payez à la réception." },
          ].map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-ember">{s.n}</span>
              <h3 className="font-display text-lg mt-2 text-void">{s.t}</h3>
              <p className="text-sm mt-2 text-sack">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suivi de commande */}
      <section className="px-6 py-14 md:px-14 bg-paperdeep/40">
        <span className="text-xs font-mono uppercase tracking-widest text-ash">Suivi</span>
        <h2 className="font-display text-2xl md:text-3xl mt-1 mb-6 text-void">Suivre ma commande</h2>

        {!phone ? (
          <div className="max-w-sm rounded-wuta p-6 bg-white border border-paperdeep">
            <p className="text-sm text-sack mb-3">
              Entrez le numéro de téléphone utilisé lors de votre commande.
            </p>
            <div className="flex gap-2">
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Ex : 90 00 00 00"
                className="flex-1 px-3 py-2.5 rounded-lg text-sm border border-paperdeep"
              />
              <button
                onClick={() => phoneInput.trim() && setPhone(phoneInput.trim())}
                disabled={!phoneInput.trim()}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-ember text-white disabled:opacity-50"
              >
                Voir
              </button>
            </div>
          </div>
        ) : loading && orders === null ? (
          <p className="text-sm text-ash">Recherche de vos commandes…</p>
        ) : orders && orders.length === 0 ? (
          <p className="text-sm text-ash">Aucune commande trouvée pour ce numéro.</p>
        ) : (
          <div className="space-y-6">
            {(orders || []).map((o) => (
              <div key={o.id} className="rounded-wuta bg-white border border-paperdeep overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-4 border-b border-paperdeep">
                  <div>
                    <p className="font-mono text-sm font-semibold text-void">{o.reference}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {new Date(o.createdAt + "Z").toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <Badge className={STATUS_STYLE[o.status] || "bg-steel"}>{o.status}</Badge>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-start gap-2 text-sm text-sack mb-3">
                    <MapPin size={15} className="mt-0.5 shrink-0" /> {o.customerAddress}
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-sack">
                        <span className="flex items-center gap-2"><Package size={13} /> {it.qty}× {it.name}</span>
                        <span className="font-mono">{formatFCFA(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-paperdeep">
                    <span className="text-sm text-ash">Total</span>
                    <span className="font-display text-lg text-void">{formatFCFA(o.total)}</span>
                  </div>
                </div>
                {o.latitude != null && o.longitude != null && (
                  <div className="border-t border-paperdeep">
                    <OrdersMap orders={[o]} height={200} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
