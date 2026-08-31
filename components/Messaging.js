"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Bell, Flame } from "lucide-react";
import { pushSupported, enablePushNotifications } from "../lib/pushClient";

const IDENTITY_KEY = "wuta_customer_v1";
const POLL_MS = 4000;

export default function Messaging() {
  const [identity, setIdentity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notifState, setNotifState] = useState("default"); // default | granted | denied | unsupported
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(IDENTITY_KEY);
      if (saved) setIdentity(JSON.parse(saved));
    } catch (e) {}
    if (!pushSupported) setNotifState("unsupported");
    else if (typeof Notification !== "undefined") setNotifState(Notification.permission);
  }, []);

  useEffect(() => {
    if (!identity?.phone) return;
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/messages?phone=${encodeURIComponent(identity.phone)}`);
      const data = await res.json();
      if (!cancelled) setMessages(data.messages || []);
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [identity]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveIdentity(name, phone) {
    const value = { name, phone };
    setIdentity(value);
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(value));
    } catch (e) {}
  }

  async function send() {
    if (!draft.trim() || !identity) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identity.phone, name: identity.name, body: draft }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleEnableNotifications() {
    const ok = await enablePushNotifications({ scope: "client", phone: identity.phone });
    setNotifState(ok ? "granted" : (typeof Notification !== "undefined" ? Notification.permission : "denied"));
  }

  if (!identity) {
    return <IdentityForm onSubmit={saveIdentity} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white border-b border-paperdeep">
        <a href="/" className="flex items-center gap-2 text-sm text-sack">
          <ArrowLeft size={16} /> Boutique
        </a>
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-ember" />
          <span className="font-display text-base text-void">Messagerie WUTA</span>
        </div>
        <span className="w-16" />
      </header>

      {notifState !== "granted" && notifState !== "unsupported" && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm bg-paperdeep">
          <span className="flex items-center gap-2 text-sack">
            <Bell size={16} /> Recevez une notification quand on vous répond, même sans avoir l'appli ouverte.
          </span>
          <button
            onClick={handleEnableNotifications}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ember text-white"
          >
            Activer
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <p className="text-sm text-ash text-center mt-10">
            Bonjour {identity.name.split(" ")[0]}, posez votre question ici — un membre de l'équipe WUTA
            vous répondra directement dans cette messagerie.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                m.sender === "client" ? "bg-ember text-white rounded-br-sm" : "bg-white border border-paperdeep text-void rounded-bl-sm"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 px-5 py-4 bg-white border-t border-paperdeep">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Écrire un message…"
          className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-paperdeep max-w-2xl"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="p-2.5 rounded-lg bg-ember text-white disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function IdentityForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-paper">
      <div className="max-w-sm w-full rounded-wuta p-6 bg-white border border-paperdeep">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} className="text-ember" />
          <h1 className="font-display text-lg text-void">Messagerie WUTA</h1>
        </div>
        <p className="text-sm text-ash mb-5">
          Indiquez votre nom et votre numéro pour démarrer une conversation avec l'équipe WUTA.
        </p>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="w-full px-3 py-2.5 rounded-lg text-sm border border-paperdeep"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numéro de téléphone"
            className="w-full px-3 py-2.5 rounded-lg text-sm border border-paperdeep"
          />
        </div>
        <button
          onClick={() => name.trim() && phone.trim() && onSubmit(name.trim(), phone.trim())}
          disabled={!name.trim() || !phone.trim()}
          className="w-full mt-4 py-3 rounded-lg font-semibold text-sm bg-ember text-white disabled:opacity-50"
        >
          Démarrer la conversation
        </button>
      </div>
    </div>
  );
}
