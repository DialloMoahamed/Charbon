"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

export default function SettingsPanel() {
  const [contactPhone, setContactPhone] = useState("");
  const [contactCity, setContactCity] = useState("");
  const [pushConfigured, setPushConfigured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setContactPhone(data.contactPhone || "");
        setContactCity(data.contactCity || "");
        setPushConfigured(data.pushConfigured);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactPhone, contactCity }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ash">Chargement…</p>;

  return (
    <div className="max-w-lg">
      <h3 className="font-display text-2xl mb-1 text-void">Paramètres</h3>
      <p className="text-sm text-ash mb-6">Coordonnées affichées sur le site, et diagnostic des notifications.</p>

      <div className="rounded-xl p-5 bg-white border border-paperdeep space-y-4">
        <h4 className="font-semibold text-sm text-void">Coordonnées de contact</h4>
        <div>
          <label className="text-xs font-semibold text-ash">Téléphone affiché</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Ex : +227 90 00 00 00"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ash">Ville</label>
          <input
            value={contactCity}
            onChange={(e) => setContactCity(e.target.value)}
            placeholder="Ex : Niamey, Niger"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-ember text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <p className="text-xs text-leaf">Coordonnées mises à jour sur le site.</p>}
      </div>

      <div className="rounded-xl p-5 mt-5 bg-white border border-paperdeep">
        <h4 className="font-semibold text-sm mb-2 text-void">Notifications push</h4>
        {pushConfigured ? (
          <p className="flex items-center gap-2 text-sm text-leaf">
            <Bell size={16} /> Clés VAPID configurées — la messagerie peut envoyer des notifications.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emberdeep">
            <BellOff size={16} /> Clés VAPID non configurées. Générez-les avec{" "}
            <code className="px-1 py-0.5 rounded bg-paperdeep text-xs">npx web-push generate-vapid-keys</code>{" "}
            puis ajoutez-les dans <code className="px-1 py-0.5 rounded bg-paperdeep text-xs">.env.local</code>.
          </p>
        )}
      </div>
    </div>
  );
}
