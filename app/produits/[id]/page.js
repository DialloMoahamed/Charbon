import ProductDetail from "../../../components/ProductDetail";
const { getSetting } = require("../../../lib/settings");

export const metadata = { title: "Produit — WUTA" };
export const dynamic = "force-dynamic";

export default function Page({ params }) {
  const contactPhone = getSetting("contactPhone", process.env.PUBLIC_CONTACT_PHONE || "Contactez-nous");
  const contactCity = getSetting("contactCity", process.env.PUBLIC_CONTACT_CITY || "Niger");
  return <ProductDetail productId={params.id} contactPhone={contactPhone} contactCity={contactCity} />;
}
