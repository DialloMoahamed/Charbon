import { Flame, MapPin, Phone, MessageCircle, Lock } from "lucide-react";

export default function StoreFooter({ contactPhone, contactCity }) {
  return (
    <footer id="contact" className="px-6 py-14 md:px-14 bg-void text-ashlight">
      <div className="flex flex-wrap justify-between gap-8">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-ember" />
            <span className="font-display text-lg text-paper">WUTA Charbon</span>
          </div>
          <p className="text-sm mt-3 max-w-xs">Vente de charbon de bois, braise et éco-charbon.</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="flex items-center gap-2"><MapPin size={16} /> {contactCity}</p>
          <p className="flex items-center gap-2"><Phone size={16} /> {contactPhone}</p>
          <a href="/messages" className="flex items-center gap-2 opacity-90 hover:opacity-100">
            <MessageCircle size={16} /> Messagerie / service client
          </a>
          <a href="/admin" className="flex items-center gap-2 opacity-70 hover:opacity-100">
            <Lock size={14} /> Espace pro
          </a>
        </div>
      </div>
    </footer>
  );
}
