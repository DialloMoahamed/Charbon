"use client";

export const CATEGORY_COLORS = {
  "Ménage": "bg-sack",
  "Grillade": "bg-emberdeep",
  "Industriel": "bg-steel",
  "Écologique": "bg-leaf",
};

export function formatFCFA(n) {
  return Number(n).toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
}

export function Badge({ children, className = "" }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full text-white tracking-wide ${className}`}>
      {children}
    </span>
  );
}

export function StockGauge({ stock, capacity }) {
  const pct = Math.max(0, Math.min(100, Math.round((stock / (capacity || 1)) * 100)));
  const color = pct === 0 ? "bg-steel" : pct < 20 ? "bg-emberdeep" : "bg-leaf";
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden bg-paperdeep">
      <div className={`h-full rounded-full ${color}`} style={{ width: pct + "%" }} />
    </div>
  );
}
