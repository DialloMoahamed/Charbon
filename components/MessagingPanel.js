"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bell, User } from "lucide-react";
import { pushSupported, enablePushNotifications } from "../lib/pushClient";
import { voiceRecordingSupported, useVoiceRecorder, RecordingBar, MicButton, VoiceMessageBubble } from "./VoiceMessage";

const POLL_LIST_MS = 6000;
const POLL_THREAD_MS = 4000;

function timeAgo(iso) {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso + "Z").getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return `il y a ${Math.round(diffH / 24)} j`;
}

function timeLabel(iso) {
  return new Date(iso + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagingPanel({ initialConversationId, onConsumeInitial }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notifState, setNotifState] = useState("default");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      onConsumeInitial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  useEffect(() => {
    if (!pushSupported) setNotifState("unsupported");
    else if (typeof Notification !== "undefined") setNotifState(Notification.permission);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) {
        setConversations(data);
        if (!activeId && data.length > 0) setActiveId(data[0].id);
      }
    }
    load();
    const interval = setInterval(load, POLL_LIST_MS);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/messages/${activeId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) setMessages(data.messages || []);
    }
    load();
    const interval = setInterval(load, POLL_THREAD_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
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

  async function sendVoice(blob) {
    if (!activeId) return;
    setSending(true);
    try {
      const uploadRes = await fetch("/api/uploads/voice", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      const upload = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(upload.error || "Échec de l'envoi du vocal.");

      const res = await fetch(`/api/messages/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: upload.url }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  const recorder = useVoiceRecorder(sendVoice);

  async function handleEnableNotifications() {
    const ok = await enablePushNotifications({ scope: "admin" });
    setNotifState(ok ? "granted" : (typeof Notification !== "undefined" ? Notification.permission : "denied"));
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div>
      <h3 className="font-display text-2xl mb-1 text-void">Messagerie</h3>
      <p className="text-sm text-ash mb-4">
        Conversations avec les clients — pas de WhatsApp ni de SMS, tout se passe ici.
      </p>

      {notifState !== "granted" && notifState !== "unsupported" && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 mb-5 rounded-xl text-sm bg-paperdeep">
          <span className="flex items-center gap-2 text-sack">
            <Bell size={16} /> Activez les notifications pour être alerté d'un nouveau message même hors de l'admin.
          </span>
          <button
            onClick={handleEnableNotifications}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ember text-white"
          >
            Activer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-xl overflow-hidden border border-paperdeep bg-white" style={{ height: 560 }}>
        {/* Liste des conversations */}
        <div className="border-r border-paperdeep overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-ash p-4">Aucune conversation pour le moment.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-paperdeep ${
                  c.id === activeId ? "bg-paperdeep" : "hover:bg-paperdeep/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-void truncate">
                    {c.customerName || c.customerPhone}
                  </span>
                  {c.unreadForAdmin > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-ember text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unreadForAdmin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ash truncate mt-0.5">{c.lastMessagePreview || "—"}</p>
                <p className="text-[10px] text-ashlight mt-1">{timeAgo(c.lastMessageAt)}</p>
              </button>
            ))
          )}
        </div>

        {/* Fil de conversation */}
        <div className="flex flex-col min-w-0 bg-[#e7ded3]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-ash bg-white">
              Sélectionnez une conversation.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-paperdeep bg-white">
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-paperdeep text-sack">
                  <User size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-void">{active.customerName || "Client"}</p>
                  <p className="text-xs text-ash">{active.customerPhone}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.map((m) => {
                  const mine = m.sender === "admin";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 shadow-sm ${
                          mine
                            ? "bg-ember text-white rounded-2xl rounded-br-md"
                            : "bg-white text-void rounded-2xl rounded-bl-md"
                        }`}
                      >
                        {m.type === "audio" && m.audioUrl ? (
                          <VoiceMessageBubble url={m.audioUrl} mine={mine} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                        )}
                        <p className={`text-[10px] text-right mt-1 ${mine ? "text-white/70" : "text-ash"}`}>
                          {timeLabel(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-t border-paperdeep bg-white">
                {recorder.recording ? (
                  <RecordingBar seconds={recorder.seconds} onCancel={recorder.cancel} onSend={recorder.stop} />
                ) : (
                  <>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder="Répondre…"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border border-paperdeep"
                    />
                    {draft.trim() ? (
                      <button
                        onClick={send}
                        disabled={sending}
                        className="p-2 rounded-lg bg-ember text-white disabled:opacity-50"
                        aria-label="Envoyer"
                      >
                        <Send size={16} />
                      </button>
                    ) : voiceRecordingSupported ? (
                      <MicButton onClick={recorder.start} className="p-2 rounded-lg bg-ember text-white" />
                    ) : null}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
