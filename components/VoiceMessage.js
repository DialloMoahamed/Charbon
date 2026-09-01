"use client";

import { useRef, useState } from "react";
import { Play, Pause, Mic, Square, X } from "lucide-react";

export const voiceRecordingSupported =
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

function extFromMime(mime) {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Enregistrement micro → blob audio. `onRecorded(blob)` est appelé une fois
 * l'enregistrement arrêté normalement (pas en cas d'annulation).
 */
export function useVoiceRecorder(onRecorded) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        if (!cancelledRef.current && chunksRef.current.length > 0) {
          const mime = recorder.mimeType || "audio/webm";
          onRecorded(new Blob(chunksRef.current, { type: mime }), extFromMime(mime));
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      alert("Impossible d'accéder au micro. Vérifiez les autorisations de votre navigateur.");
    }
  }

  function stop() {
    cancelledRef.current = false;
    recorderRef.current?.stop();
    setRecording(false);
  }

  function cancel() {
    cancelledRef.current = true;
    recorderRef.current?.stop();
    setRecording(false);
  }

  return { recording, seconds, start, stop, cancel };
}

/** Barre affichée pendant l'enregistrement, remplace le champ texte. */
export function RecordingBar({ seconds, onCancel, onSend }) {
  return (
    <div className="flex items-center gap-3 flex-1 px-3">
      <button onClick={onCancel} className="text-ash" aria-label="Annuler">
        <X size={18} />
      </button>
      <span className="w-2 h-2 rounded-full bg-emberdeep animate-pulse" />
      <span className="text-sm font-mono text-sack flex-1">{formatDuration(seconds)}</span>
      <button onClick={onSend} className="p-2 rounded-lg bg-ember text-white" aria-label="Envoyer le vocal">
        <Square size={14} fill="currentColor" />
      </button>
    </div>
  );
}

export function MicButton({ onClick, className = "" }) {
  return (
    <button onClick={onClick} className={className} aria-label="Enregistrer un vocal">
      <Mic size={18} />
    </button>
  );
}

/** Bulle de lecture façon WhatsApp : bouton play/pause + barre de progression + durée. */
export function VoiceMessageBubble({ url, mine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2 w-48">
      <button
        onClick={toggle}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          mine ? "bg-white/20" : "bg-ember/10 text-ember"
        }`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${mine ? "bg-white/25" : "bg-paperdeep"}`}>
          <div
            className={`h-1 rounded-full ${mine ? "bg-white" : "bg-ember"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${mine ? "text-white/80" : "text-ash"}`}>
        {formatDuration(playing || current > 0 ? current : duration)}
      </span>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
      />
    </div>
  );
}
