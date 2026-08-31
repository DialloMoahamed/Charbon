"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Lock, LogOut, Plus, Minus, Edit2, Trash2, ArrowLeft, X, MapPin,
  Flame, LayoutDashboard, ClipboardList, Boxes, MapPinned, BarChart3, Users2, Users,
  MessageCircle, Archive, Settings as SettingsIcon,
} from "lucide-react";
import { Badge, formatFCFA, CATEGORY_COLORS, StockGauge } from "./ui";
import StatsPanel from "./StatsPanel";
import TeamPanel from "./TeamPanel";
import DashboardPanel from "./DashboardPanel";
import MessagingPanel from "./MessagingPanel";
import ClientsPanel from "./ClientsPanel";
import SettingsPanel from "./SettingsPanel";

// Leaflet a besoin de `window` : on ne le charge jamais côté serveur.
const OrdersMap = dynamic(() => import("./OrdersMap"), { ssr: false });

const CATEGORIES = ["Ménage", "Grillade", "Industriel", "Écologique"];

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "orders", label: "Commandes", Icon: ClipboardList },
  { id: "messages", label: "Messagerie", Icon: MessageCircle },
  { id: "products", label: "Produits", Icon: Boxes },
  { id: "inventory", label: "Stock", Icon: Archive },
  { id: "stats", label: "Statistiques", Icon: BarChart3 },
  { id: "map", label: "Carte de livraison", Icon: MapPinned },
  { id: "clients", label: "Clients", Icon: Users },
];

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
  const [tab, setTab] = useState("dashboard");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingConversationId, setPendingConversationId] = useState(null);

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

  // Badge de messages non lus dans la sidebar, indépendant de l'onglet actif.
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    function poll() {
      fetch("/api/conversations")
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => {
          if (!cancelled) setUnreadMessages(list.reduce((s, c) => s + (c.unreadForAdmin || 0), 0));
        });
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [authed]);

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
              className="w-full mt-4 py-3 rounded-lg font-semibold text-sm bg-ember text-white disabled:opacity-60"
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

  const navItems = NAV_ITEMS
    .concat(role === "super_admin" ? [{ id: "team", label: "Équipe", Icon: Users2 }] : [])
    .concat([{ id: "settings", label: "Paramètres", Icon: SettingsIcon }]);
  const tabTitles = Object.fromEntries(navItems.map((n) => [n.id, n.label]));

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-void">
        <div className="px-6 py-5 flex items-center gap-2 border-b border-voidline">
          <Flame size={20} className="text-ember" />
          <div>
            <p className="font-display text-lg text-paper leading-tight">WUTA</p>
            <p className="text-[10px] uppercase tracking-wider text-ash leading-tight">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                tab === id ? "bg-ember text-white" : "text-ashlight hover:bg-voidsoft"
              }`}
            >
              <Icon size={17} /> {label}
              {id === "messages" && unreadMessages > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-ember text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-voidline space-y-1">
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ashlight hover:bg-voidsoft">
            <ArrowLeft size={17} /> Boutique
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ashlight hover:bg-voidsoft">
            <LogOut size={17} /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 md:px-10 bg-white border-b border-paperdeep">
          <div className="flex items-center gap-3 md:hidden">
            <Flame size={18} className="text-ember" />
            <span className="font-display text-base text-void">WUTA Admin</span>
          </div>
          <h2 className="hidden md:block font-display text-xl text-void">{tabTitles[tab]}</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-sack">{sessionEmail}</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full text-xs font-medium bg-paperdeep text-sack">
              {role === "super_admin" ? "Super admin" : "Gestionnaire"}
            </span>
          </div>
        </header>

        {/* Navigation mobile */}
        <div className="md:hidden flex gap-2 px-6 py-3 overflow-x-auto bg-white border-b border-paperdeep">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                tab === id ? "bg-void text-white" : "bg-paperdeep text-sack"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-8 md:px-10">
          {tab === "dashboard" && <DashboardPanel products={products} orders={orders} />}

          {tab === "messages" && (
            <MessagingPanel
              initialConversationId={pendingConversationId}
              onConsumeInitial={() => setPendingConversationId(null)}
            />
          )}

          {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl">Produits</h3>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-ember text-white"
              >
                <Plus size={16} /> Ajouter un produit
              </button>
            </div>
            <p className="text-sm text-ash mb-4">
              Fiche, prix et description de chaque produit. Pour ajuster les quantités en stock, direction l'onglet{" "}
              <button onClick={() => setTab("inventory")} className="font-semibold text-ember">Stock</button>.
            </p>
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
                        <span className={`font-mono ${p.stock === 0 ? "text-emberdeep" : ""}`}>{p.stock}</span>
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

        {tab === "inventory" && (
          <InventoryPanel products={products} onAdjust={adjustStock} />
        )}

        {tab === "clients" && (
          <ClientsPanel onOpenConversation={(id) => { setPendingConversationId(id); setTab("messages"); }} />
        )}

        {tab === "settings" && <SettingsPanel />}

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

function InventoryPanel({ products, onAdjust }) {
  const [filter, setFilter] = useState("tous");

  const withStatus = products.map((p) => ({
    ...p,
    status: p.stock === 0 ? "rupture" : p.stock / p.capacity < 0.2 ? "faible" : "ok",
  }));

  const filtered = withStatus
    .filter((p) => filter === "tous" || p.status === filter)
    .sort((a, b) => a.stock - b.stock);

  const counts = {
    tous: withStatus.length,
    rupture: withStatus.filter((p) => p.status === "rupture").length,
    faible: withStatus.filter((p) => p.status === "faible").length,
  };

  return (
    <div>
      <h3 className="font-display text-2xl mb-1 text-void">Stock</h3>
      <p className="text-sm text-ash mb-4">Niveaux de stock de tous les produits, ajustables en un clic.</p>

      <div className="flex gap-2 mb-4">
        {[
          { id: "tous", label: `Tous (${counts.tous})` },
          { id: "faible", label: `Stock faible (${counts.faible})` },
          { id: "rupture", label: `Rupture (${counts.rupture})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === f.id ? "bg-void text-white" : "bg-paperdeep text-sack"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ash">Aucun produit dans cette catégorie.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paperdeep">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-paperdeep text-sack">
                <th className="text-left px-4 py-3 font-semibold">Produit</th>
                <th className="text-left px-4 py-3 font-semibold">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold">Niveau</th>
                <th className="text-left px-4 py-3 font-semibold">Stock</th>
                <th className="text-left px-4 py-3 font-semibold">Ajuster</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-paperdeep">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3"><Badge className={CATEGORY_COLORS[p.category]}>{p.category}</Badge></td>
                  <td className="px-4 py-3 w-40"><StockGauge stock={p.stock} capacity={p.capacity} /></td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${p.status !== "ok" ? "text-emberdeep" : ""}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onAdjust(p.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-paperdeep">
                        <Minus size={12} />
                      </button>
                      <button onClick={() => onAdjust(p.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-paperdeep">
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
