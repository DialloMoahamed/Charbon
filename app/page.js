import Shop from "../components/Shop";
const { getSetting } = require("../lib/settings");

export const dynamic = "force-dynamic";

export default function HomePage() {
  const contactPhone = getSetting("contactPhone", process.env.PUBLIC_CONTACT_PHONE || "Contactez-nous");
  const contactCity = getSetting("contactCity", process.env.PUBLIC_CONTACT_CITY || "Niger");
  return <Shop contactPhone={contactPhone} contactCity={contactCity} />;
}
