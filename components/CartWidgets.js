"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { X, Plus, Minus, Check } from "lucide-react";
import { formatFCFA } from "./ui";

const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

export function CartDrawer({ open, cartItems, cartTotal, onClose, onQtyChange, onCheckout }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-paperdeep">
          <h3 className="font-display text-xl">Votre panier</h3>
          <button onClick={onClose}><X size={20} /></button>
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
                <button onClick={() => onQtyChange(item.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-paperdeep">
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-sm">{item.qty}</span>
                <button onClick={() => onQtyChange(item.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-paperdeep">
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
            <button onClick={onCheckout} className="w-full py-3 rounded-lg font-semibold text-sm bg-void text-paper">
              Passer la commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CheckoutModal({ total, onClose, onSubmit }) {
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
          className="w-full mt-4 py-3 rounded-lg font-semibold text-sm bg-ember text-white disabled:opacity-60"
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

export function OrderConfirmModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative max-w-sm w-full rounded-2xl p-8 text-center bg-white">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-leaf/20">
          <Check size={28} className="text-leaf" />
        </div>
        <h3 className="font-display text-2xl mt-4">Commande reçue</h3>
        <p className="text-sm mt-2 text-sack">
          Référence <span className="font-mono">{order.reference}</span>. Un livreur vous contactera bientôt.
        </p>
        <p className="font-display text-xl mt-4">{formatFCFA(order.total)}</p>
        <button onClick={onClose} className="mt-6 w-full py-3 rounded-lg font-semibold text-sm bg-void text-paper">
          Continuer mes achats
        </button>
      </div>
    </div>
  );
}
