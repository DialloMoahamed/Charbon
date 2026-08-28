import Shop from "../components/Shop";

export default function HomePage() {
  const contactPhone = process.env.PUBLIC_CONTACT_PHONE || "Contactez-nous";
  const contactCity = process.env.PUBLIC_CONTACT_CITY || "Niger";
  return <Shop contactPhone={contactPhone} contactCity={contactCity} />;
}
