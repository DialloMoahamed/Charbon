import { Suspense } from "react";
import ProductsPage from "../../components/ProductsPage";
const { getSetting } = require("../../lib/settings");

export const metadata = { title: "Produits — WUTA" };
export const dynamic = "force-dynamic";

export default function Page() {
  const contactPhone = getSetting("contactPhone", process.env.PUBLIC_CONTACT_PHONE || "Contactez-nous");
  const contactCity = getSetting("contactCity", process.env.PUBLIC_CONTACT_CITY || "Niger");
  return (
    <Suspense fallback={null}>
      <ProductsPage contactPhone={contactPhone} contactCity={contactCity} />
    </Suspense>
  );
}
