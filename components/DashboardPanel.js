"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ClipboardList, Wallet, ShoppingBag, PackageX, AlertTriangle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Badge, formatFCFA, CATEGORY_COLORS } from "./ui";

const OrdersMap = dynamic(() => import("./OrdersMap"), { ssr: false });

const WEEKDAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function trend(today, yesterday) {
  if (!yesterday) return null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

function KpiCard({ icon: Icon, label, value, delta, tone = "text-void" }) {
  return (
    <div className="rounded-xl p-4 bg-white border border-paperdeep">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ash">{label}</span>
        <Icon size={16} className="text-ash" />
      </div>
      <p className={`font-display text-2xl mt-2 ${tone}`}>{value}</p>
      {delta !== null && delta !== undefined && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${delta >= 0 ? "text-leaf" : "text-emberdeep"}`}>
          {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta)}% vs hier
        </p>
      )}
    </div>
  );
}

export default function DashboardPanel({ products, orders }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock / p.capacity < 0.2);
  const outOfStock = products.filter((p) => p.stock === 0);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const chartData = (stats?.dailyRevenue || []).map((d) => ({
    label: WEEKDAY[new Date(d.day).getDay()],
    "Ventes": d.revenue,
  }));

  const todayRow = stats?.dailyRevenue?.[stats.dailyRevenue.length - 1];
  const yesterdayRow = stats?.dailyRevenue?.[stats.dailyRevenue.length - 2];
  const todayAvg = todayRow && todayRow.orders ? Math.round(todayRow.revenue / todayRow.orders) : 0;
  const yesterdayAvg = yesterdayRow && yesterdayRow.orders ? Math.round(yesterdayRow.revenue / yesterdayRow.orders) : 0;

  return (
    <div>
      <h3 className="font-display text-2xl mb-1 text-void">Tableau de bord</h3>
      <p className="text-sm text-ash mb-6">Vue d'ensemble de l'activité commerciale.</p>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3 bg-emberdeep/10 border border-emberdeep/40">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-emberdeep" />
          <p className="text-sm text-emberdeep">
            {outOfStock.length > 0 && <>{outOfStock.length} produit(s) en rupture. </>}
            {lowStock.length > 0 && <>{lowStock.length} produit(s) en stock limité.</>}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ash">Chargement du tableau de bord…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <KpiCard
              icon={ClipboardList}
              label="Commandes aujourd'hui"
              value={todayRow?.orders ?? 0}
              delta={trend(todayRow?.orders ?? 0, yesterdayRow?.orders ?? 0)}
            />
            <KpiCard
              icon={Wallet}
              label="CA aujourd'hui"
              value={formatFCFA(todayRow?.revenue ?? 0)}
              delta={trend(todayRow?.revenue ?? 0, yesterdayRow?.revenue ?? 0)}
            />
            <KpiCard
              icon={ShoppingBag}
              label="Panier moyen"
              value={formatFCFA(todayAvg)}
              delta={trend(todayAvg, yesterdayAvg)}
            />
            <KpiCard icon={AlertTriangle} label="Stock faible" value={lowStock.length} tone="text-emberdeep" />
            <KpiCard icon={PackageX} label="Rupture de stock" value={outOfStock.length} tone="text-emberdeep" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-8">
            <div className="rounded-xl p-5 bg-white border border-paperdeep">
              <h4 className="font-display text-lg mb-4 text-void">Commandes récentes</h4>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-ash">Aucune commande pour le moment.</p>
              ) : (
                <div className="divide-y divide-paperdeep">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-mono font-semibold">{o.reference}</p>
                        <p className="text-xs text-ash">{o.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatFCFA(o.total)}</p>
                        <Badge
                          className={
                            o.status === "Livrée" ? "bg-leaf" : o.status === "Annulée" ? "bg-steel" : "bg-ember"
                          }
                        >
                          {o.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-5 bg-white border border-paperdeep">
              <h4 className="font-display text-lg mb-4 text-void">Ventes (7 derniers jours)</h4>
              {chartData.length === 0 ? (
                <p className="text-sm text-ash">Pas encore assez de commandes pour afficher un historique.</p>
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F1E8" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716C" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#78716C" }} tickFormatter={(v) => v.toLocaleString("fr-FR")} />
                      <Tooltip formatter={(v) => formatFCFA(v)} contentStyle={{ borderRadius: 8, borderColor: "#F5F1E8" }} />
                      <Line type="monotone" dataKey="Ventes" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
            <div className="rounded-xl p-5 bg-white border border-paperdeep">
              <h4 className="font-display text-lg mb-4 text-void">Produits les plus vendus</h4>
              {!stats.topProducts || stats.topProducts.length === 0 ? (
                <p className="text-sm text-ash">Aucune vente enregistrée pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.slice(0, 3).map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        <span className="font-mono text-ash mr-2">{i + 1}.</span>
                        {p.name}
                      </span>
                      <span className="text-ash">{p.qty} ventes</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl overflow-hidden border border-paperdeep">
              <div className="px-5 py-3 bg-white border-b border-paperdeep">
                <h4 className="font-display text-lg text-void">Carte de livraison</h4>
              </div>
              <OrdersMap orders={orders} height={260} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
