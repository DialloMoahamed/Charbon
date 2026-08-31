"use client";

import { useState } from "react";
import {
  ShoppingCart, Flame, Menu, Lock, Search, MessageCircle,
} from "lucide-react";

export default function StoreHeader({ cartCount, onCartClick, active = "" }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NAV = [
    { href: "/#accueil", label: "Accueil", key: "accueil" },
    { href: "/produits", label: "Produits", key: "produits" },
    { href: "/#comment", label: "Livraison", key: "livraison" },
    { href: "/messages", label: "Messagerie", key: "messages" },
    { href: "/#contact", label: "Contact", key: "contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 md:px-10 bg-white border-b border-paperdeep">
        <a href="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full flex items-center justify-center bg-ember/10">
            <Flame size={19} className="text-ember" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-tight text-void">WUTA</div>
            <div className="hidden sm:block text-[10px] uppercase tracking-wider text-ash">Charbon &amp; Livraison</div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-sack">
          {NAV.map((n) => (
            <a key={n.key} href={n.href} className={active === n.key ? "text-ember" : "hover:text-void"}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex p-2 rounded-lg text-sack hover:bg-paperdeep" aria-label="Rechercher">
            <Search size={18} />
          </button>
          <a href="/messages" className="hidden sm:flex p-2 rounded-lg text-sack hover:bg-paperdeep" aria-label="Messagerie">
            <MessageCircle size={18} />
          </a>
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ember text-white font-semibold text-sm shadow-sm shadow-ember/30"
          >
            <ShoppingCart size={17} />
            <span>Panier{cartCount > 0 ? ` (${cartCount})` : ""}</span>
          </button>
          <button className="md:hidden p-2 rounded-lg text-void" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <Menu size={20} />
          </button>
        </div>
      </header>
      {mobileNavOpen && (
        <div className="md:hidden flex flex-col px-5 py-3 gap-3 text-sm bg-white border-b border-paperdeep text-sack">
          {NAV.map((n) => (
            <a key={n.key} href={n.href} onClick={() => setMobileNavOpen(false)}>{n.label}</a>
          ))}
          <a href="/admin" className="flex items-center gap-1 text-void font-medium"><Lock size={14} /> Espace pro</a>
        </div>
      )}
    </>
  );
}
