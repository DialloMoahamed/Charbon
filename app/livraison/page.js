import DeliveryPage from "../../components/DeliveryPage";
const { getSetting } = require("../../lib/settings");

export const metadata = { title: "Livraison — WUTA" };
export const dynamic = "force-dynamic";

export default function Page() {
  const contactPhone = getSetting("contactPhone", process.env.PUBLIC_CONTACT_PHONE || "Contactez-nous");
  const contactCity = getSetting("contactCity", process.env.PUBLIC_CONTACT_CITY || "Niger");
  return <DeliveryPage contactPhone={contactPhone} contactCity={contactCity} />;
}
