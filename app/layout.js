import "./globals.css";

export const metadata = {
  title: "WUTA — Charbon de bois & braise à Niamey",
  description:
    "Vente de charbon de bois, braise pour grillades et charbon industriel à Niamey. Livraison rapide, paiement à la livraison.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body bg-paper text-void">{children}</body>
    </html>
  );
}
