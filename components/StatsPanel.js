"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Receipt, CalendarDays } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { formatFCFA } from "./ui";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl p-4 bg-white border border-paperdeep flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-ash">{label}</p>
        <p className="font-display text-xl mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ash">Chargement des statistiques…</p>;
  if (!stats) return <p className="text-sm text-ash">Statistiques indisponibles pour le moment.</p>;

  const chartData = stats.monthlyRevenue.map((m) => ({
    month: formatMonthLabel(m.month),
    "Chiffre d'affaires": m.revenue,
  }));

  return (
    <div>
      <h3 className="font-display text-2xl mb-1">Statistiques de vente</h3>
      <p className="text-sm text-ash mb-6">Les commandes annulées ne sont pas comptées.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Chiffre d'affaires total" value={formatFCFA(stats.totals.revenue)} accent="bg-emberdeep" />
        <StatCard icon={CalendarDays} label="Ce mois-ci" value={formatFCFA(stats.totals.currentMonthRevenue)} accent="bg-ember" />
        <StatCard icon={Receipt} label="Commandes valides" value={stats.totals.ordersCount} accent="bg-steel" />
        <StatCard icon={ShoppingBag} label="Panier moyen" value={formatFCFA(stats.totals.avgOrder)} accent="bg-leaf" />
      </div>

      <div className="rounded-xl p-5 bg-white border border-paperdeep mb-8">
        <h4 className="font-display text-lg mb-4">Chiffre d'affaires par mois</h4>
        {chartData.length === 0 ? (
          <p className="text-sm text-ash">Pas encore assez de commandes pour afficher un historique.</p>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DFCF" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C8177" }} />
                <YAxis tick={{ fontSize: 12, fill: "#8C8177" }} tickFormatter={(v) => v.toLocaleString("fr-FR")} />
                <Tooltip formatter={(v) => formatFCFA(v)} contentStyle={{ borderRadius: 8, borderColor: "#E8DFCF" }} />
                <Bar dataKey="Chiffre d'affaires" fill="#FF6B35" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 bg-white border border-paperdeep">
        <h4 className="font-display text-lg mb-4">Produits les plus vendus</h4>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-ash">Aucune vente enregistrée pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => {
              const max = stats.topProducts[0].qty || 1;
              const pct = Math.max(6, Math.round((p.qty / max) * 100));
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">
                      <span className="font-mono text-ash mr-2">{i + 1}.</span>
                      {p.name}
                    </span>
                    <span className="text-ash">
                      {p.qty} vendus · <span className="font-mono">{formatFCFA(p.revenue)}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-paperdeep overflow-hidden">
                    <div className="h-full rounded-full bg-emberdeep" style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
