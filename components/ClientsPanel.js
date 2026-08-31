"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { formatFCFA } from "./ui";

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "").replace(/^227/, "");
}

export default function ClientsPanel({ onOpenConversation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.customerName || "").toLowerCase().includes(q) || c.customerPhone.includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-display text-2xl text-void">Clients</h3>
          <p className="text-sm text-ash mt-1">Reconstitués à partir de l'historique des commandes.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom ou un numéro…"
          className="px-3 py-2 rounded-lg text-sm border border-paperdeep w-full sm:w-64"
        />
      </div>

      {loading ? (
        <p className="text-sm text-ash">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ash">Aucun client trouvé.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paperdeep">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-paperdeep text-sack">
                <th className="text-left px-4 py-3 font-semibold">Client</th>
                <th className="text-left px-4 py-3 font-semibold">Téléphone</th>
                <th className="text-left px-4 py-3 font-semibold">Commandes</th>
                <th className="text-left px-4 py-3 font-semibold">Total dépensé</th>
                <th className="text-left px-4 py-3 font-semibold">Dernière commande</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.customerPhone} className="border-t border-paperdeep">
                  <td className="px-4 py-3 font-medium">{c.customerName || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.customerPhone}</td>
                  <td className="px-4 py-3">{c.ordersCount}</td>
                  <td className="px-4 py-3 font-mono">{formatFCFA(c.totalSpent || 0)}</td>
                  <td className="px-4 py-3 text-xs text-ash">
                    {new Date(c.lastOrderAt + "Z").toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onOpenConversation(normalizePhone(c.customerPhone))}
                      className="flex items-center gap-1.5 text-ember text-xs font-semibold"
                    >
                      <MessageCircle size={14} /> Message
                    </button>
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
