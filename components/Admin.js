"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Lock, LogOut, Plus, Minus, Edit2, Trash2, AlertTriangle, ArrowLeft, X, MapPin,
} from "lucide-react";
import { Badge, formatFCFA, CATEGORY_COLORS } from "./ui";
import StatsPanel from "./StatsPanel";
import TeamPanel from "./TeamPanel";

// Leaflet a besoin de `window` : on ne le charge jamais côté serveur.
const OrdersMap = dynamic(() => import("./OrdersMap"), { ssr: false });

const CATEGORIES = ["Ménage", "Grillade", "Industriel", "Écologique"];

export default function Admin() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [role, setRole] = useState("gestionnaire");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("stock");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setSessionEmail(data.email);
          setRole(data.role);
          setAuthed(true);
          loadData();
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function loadData() {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/orders").then((r) => (r.ok ? r.json() : [])).then(setOrders);
  }

  async function handleLogin() {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connexion impossible.");
      setSessionEmail(data.email);
      setRole(data.role);
      setAuthed(true);
      loadData();
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setProducts([]);
    setOrders([]);
  }

  async function adjustStock(id, delta) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockDelta: delta }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  }

  async function saveProductForm(data) {
    const isEdit = editingProduct && editingProduct.id;
    const res = await fetch(isEdit ? `/api/products/${editingProduct.id}` : "/api/products", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = await res.json();
      setProducts((prev) => (isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]));
      setShowForm(false);
      setEditingProduct(null);
    }
  }

  async function deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    }
  }

  async function setOrderStatus(id, status) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  }

  if (checkingSession) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-void">
        <div className="max-w-sm w-full">
          <a href="/" className="flex items-center gap-2 text-sm mb-6 text-ashlight">
            <ArrowLeft size={16} /> Retour à la boutique
          </a>
          <div className="rounded-2xl p-8 bg-voidsoft border border-voidline">
            <Lock size={24} className="text-ember" />
            <h2 className="font-display text-2xl mt-4 text-paper">Espace pro</h2>
            <p className="text-sm mt-1 text-ash">Réservé à la gestion des stocks et des commandes.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full mt-5 px-3 py-2 rounded-lg text-sm bg-void border border-voidline text-paper"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Mot de passe"
              className="w-full mt-3 px-3 py-2 rounded-lg text-sm bg-void border border-voidline text-paper"
            />
            {loginError && <p className="text-xs mt-2 text-ember">{loginError}</p>}
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full mt-4 py-3 rounded-lg font-semibold text-sm bg-ember text-void disabled:opacity-60"
            >
              {loggingIn ? "Connexion…" : "Se connecter"}
            </button>
            <p className="text-xs mt-4 text-ash">
              Aucun identifiant par défaut : le compte admin est créé via <span className="font-mono">npm run seed</span>{" "}
              à partir de votre fichier .env.local.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const lowStock = products.filter((p) => p.stock > 0 && p.stock / p.capacity < 0.2);
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-6 py-4 md:px-10 bg-void">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-sm text-ashlight">
            <ArrowLeft size={16} /> Boutique
          </a>
          <span className="font-display text-lg text-paper">Espace pro — WUTA</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-ashlight">
          <LogOut size={16} /> Déconnexion
        </button>
      </header>

      <div className="px-6 py-8 md:px-10">
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="rounded-xl p-4 mb-8 flex items-start gap-3 bg-emberdeep/10 border border-emberdeep/40">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-emberdeep" />
            <p className="text-sm text-emberdeep">
              {outOfStock.length > 0 && <>{outOfStock.length} produit(s) en rupture. </>}
              {lowStock.length > 0 && <>{lowStock.length} produit(s) en stock limité.</>}
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("stock")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "stock" ? "bg-void text-paper" : "bg-paperdeep text-sack"}`}
          >
            Stock &amp; produits
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "orders" ? "bg-void text-paper" : "bg-paperdeep text-sack"}`}
          >
            Commandes ({orders.length})
          </button>
          <button
            onClick={() => setTab("map")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "map" ? "bg-void text-paper" : "bg-paperdeep text-sack"}`}
          >
            Carte
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "stats" ? "bg-void text-paper" : "bg-paperdeep text-sack"}`}
          >
            Statistiques
          </button>
          {role === "super_admin" && (
            <button
              onClick={() => setTab("team")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "team" ? "bg-void text-paper" : "bg-paperdeep text-sack"}`}
            >
              Équipe
            </button>
          )}
        </div>

        {tab === "stock" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl">Produits</h3>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-ember text-void"
              >
                <Plus size={16} /> Ajouter un produit
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-paperdeep">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="bg-paperdeep text-sack">
                    <th className="text-left px-4 py-3 font-semibold">Produit</th>
                    <th className="text-left px-4 py-3 font-semibold">Catégorie</th>
                    <th className="text-left px-4 py-3 font-semibold">Prix</th>
                    <th className="text-left px-4 py-3 font-semibold">Stock</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-paperdeep">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-paperdeep shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-ash">—</span>
                            )}
                          </div>
                          {p.name}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className={CATEGORY_COLORS[p.category]}>{p.category}</Badge></td>
                      <td className="px-4 py-3 font-mono">{formatFCFA(p.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => adjustStock(p.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-paperdeep">
                            <Minus size={12} />
                          </button>
                          <span className={`font-mono w-8 text-center ${p.stock === 0 ? "text-emberdeep" : ""}`}>{p.stock}</span>
                          <button onClick={() => adjustStock(p.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-paperdeep">
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="text-steel">
                            <Edit2 size={16} />
                          </button>
                          {deleteConfirmId === p.id ? (
                            <span className="flex items-center gap-2 text-xs">
                              <button onClick={() => deleteProduct(p.id)} className="font-semibold text-emberdeep">Confirmer</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="text-ash">Annuler</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(p.id)} className="text-emberdeep">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <h3 className="font-display text-2xl mb-4">Commandes</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-ash">Aucune commande pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl p-4 bg-white border border-paperdeep">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold font-mono text-sm">{o.reference}</p>
                        <p className="text-xs text-ash">
                          {new Date(o.createdAt).toLocaleString("fr-FR")} · {o.customerName} · {o.customerPhone}
                        </p>
                        <p className="text-xs text-ash">{o.customerAddress}</p>
                        {o.latitude != null && o.longitude != null && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emberdeep font-medium flex items-center gap-1 mt-1"
                          >
                            <MapPin size={12} /> Itinéraire
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg">{formatFCFA(o.total)}</span>
                        <select
                          value={o.status}
                          onChange={(e) => setOrderStatus(o.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-paperdeep"
                        >
                          <option>En attente</option>
                          <option>Livrée</option>
                          <option>Annulée</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {o.items.map((it) => (
                        <span key={it.id} className="text-xs px-2 py-1 rounded-full bg-paperdeep text-sack">
                          {it.qty} × {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "map" && (
          <div>
            <h3 className="font-display text-2xl mb-4">Carte des livraisons</h3>
            <OrdersMap orders={orders} />
          </div>
        )}

        {tab === "stats" && <StatsPanel />}

        {tab === "team" && role === "super_admin" && <TeamPanel currentEmail={sessionEmail} />}
      </div>

      {showForm && (
        <ProductForm
          initial={editingProduct}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
          onSave={saveProductForm}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "Ménage");
  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [stock, setStock] = useState(initial?.stock ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [burnTime, setBurnTime] = useState(initial?.burnTime || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [icon, setIcon] = useState(initial?.icon || "sack");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim() || price === "" || stock === "" || !weightKg) {
      setError("Renseignez au moins le nom, le poids, le prix et le stock.");
      return;
    }
    onSave({
      name, category, weightKg: Number(weightKg), price: Number(price),
      stock: Number(stock), capacity: Number(capacity) || Number(stock) || 1,
      burnTime, description, icon, imageUrl,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative max-w-lg w-full rounded-2xl p-6 max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">{initial ? "Modifier le produit" : "Nouveau produit"}</h3>
          <button onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-ash">Nom du produit</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Icône</label>
            <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep">
              <option value="sack">Sac</option>
              <option value="flame">Flamme</option>
              <option value="truck">Camion</option>
              <option value="leaf">Feuille</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Poids (kg)</label>
            <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Prix (FCFA)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Stock initial</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Capacité max (jauge)</label>
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-ash">Durée de braise</label>
            <input value={burnTime} onChange={(e) => setBurnTime(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" placeholder="Ex : 6 à 8h" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-ash">Photo du produit (URL)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep"
              placeholder="https://…  (laissez vide pour une illustration par défaut)"
            />
            {imageUrl ? (
              <img src={imageUrl} alt="Aperçu" className="mt-2 h-24 w-full object-cover rounded-lg border border-paperdeep" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <p className="text-xs text-ash mt-1">
                Hébergez votre photo (téléphone, Google Drive en public, Cloudinary…) puis collez son lien ici.
              </p>
            )}
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-ash">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
        </div>
        {error && <p className="text-xs mt-3 text-emberdeep">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-paperdeep text-sack">Annuler</button>
          <button onClick={submit} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-void text-paper">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
