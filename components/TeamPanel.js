"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, User, X, KeyRound } from "lucide-react";

const ROLE_LABELS = {
  super_admin: "Administrateur principal",
  gestionnaire: "Gestionnaire",
};

export default function TeamPanel({ currentEmail }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState("");

  function loadAdmins() {
    setLoading(true);
    fetch("/api/admins")
      .then((r) => r.json())
      .then(setAdmins)
      .finally(() => setLoading(false));
  }

  useEffect(loadAdmins, []);

  async function createAdmin(data) {
    setError("");
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Impossible de créer ce compte.");
      return;
    }
    setAdmins((prev) => [...prev, result]);
    setShowForm(false);
  }

  async function changeRole(id, role) {
    const res = await fetch(`/api/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Impossible de changer ce rôle.");
      return;
    }
    setAdmins((prev) => prev.map((a) => (a.id === id ? result : a)));
  }

  async function resetPassword(id, password) {
    setError("");
    const res = await fetch(`/api/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Impossible de réinitialiser ce mot de passe.");
      return;
    }
    setResetTarget(null);
  }

  async function deleteAdmin(id) {
    setError("");
    const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Impossible de supprimer ce compte.");
      return;
    }
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirmId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-2xl">Équipe</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-ember text-void"
        >
          <Plus size={16} /> Ajouter un compte
        </button>
      </div>
      <p className="text-sm text-ash mb-6">
        Les <strong>administrateurs principaux</strong> peuvent tout faire, y compris gérer l'équipe. Les{" "}
        <strong>gestionnaires</strong> gèrent les produits, le stock et les commandes, mais pas les comptes admin.
      </p>

      {error && (
        <p className="text-sm text-emberdeep mb-4 px-4 py-2 rounded-lg bg-emberdeep/10 border border-emberdeep/30">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ash">Chargement…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paperdeep">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-paperdeep text-sack">
                <th className="text-left px-4 py-3 font-semibold">Compte</th>
                <th className="text-left px-4 py-3 font-semibold">Rôle</th>
                <th className="text-left px-4 py-3 font-semibold">Créé le</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t border-paperdeep">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {a.role === "super_admin" ? <Shield size={14} className="text-ember" /> : <User size={14} className="text-ash" />}
                      {a.email}
                      {a.email === currentEmail && <span className="text-xs text-ash">(vous)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.role}
                      onChange={(e) => changeRole(a.id, e.target.value)}
                      disabled={a.email === currentEmail}
                      className="text-xs px-2 py-1 rounded-lg border border-paperdeep disabled:opacity-50"
                    >
                      <option value="super_admin">Administrateur principal</option>
                      <option value="gestionnaire">Gestionnaire</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setResetTarget(a)} className="text-steel flex items-center gap-1 text-xs">
                        <KeyRound size={14} /> Mot de passe
                      </button>
                      {a.email !== currentEmail &&
                        (deleteConfirmId === a.id ? (
                          <span className="flex items-center gap-2 text-xs">
                            <button onClick={() => deleteAdmin(a.id)} className="font-semibold text-emberdeep">Confirmer</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-ash">Annuler</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(a.id)} className="text-emberdeep">
                            <Trash2 size={14} />
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <NewAdminModal onCancel={() => setShowForm(false)} onSave={createAdmin} />
      )}
      {resetTarget && (
        <ResetPasswordModal
          admin={resetTarget}
          onCancel={() => setResetTarget(null)}
          onSave={(password) => resetPassword(resetTarget.id, password)}
        />
      )}
    </div>
  );
}

function NewAdminModal({ onCancel, onSave }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("gestionnaire");
  const [error, setError] = useState("");

  function submit() {
    if (!email.trim() || password.length < 8) {
      setError("Email requis et mot de passe d'au moins 8 caractères.");
      return;
    }
    onSave({ email, password, role });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative max-w-sm w-full rounded-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Nouveau compte</h3>
          <button onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ash">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Mot de passe (8 caractères min.)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ash">Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-paperdeep">
              <option value="gestionnaire">Gestionnaire (stock &amp; commandes)</option>
              <option value="super_admin">Administrateur principal (accès complet)</option>
            </select>
          </div>
        </div>
        {error && <p className="text-xs mt-3 text-emberdeep">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-paperdeep text-sack">Annuler</button>
          <button onClick={submit} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-void text-paper">Créer</button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ admin, onCancel, onSave }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    onSave(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative max-w-sm w-full rounded-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Nouveau mot de passe</h3>
          <button onClick={onCancel}><X size={20} /></button>
        </div>
        <p className="text-sm text-ash mb-3">Pour le compte {admin.email}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="w-full px-3 py-2 rounded-lg text-sm border border-paperdeep"
        />
        {error && <p className="text-xs mt-2 text-emberdeep">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-paperdeep text-sack">Annuler</button>
          <button onClick={submit} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-void text-paper">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
