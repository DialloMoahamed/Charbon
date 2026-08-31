export async function submitOrder(cartItems, customer) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      note: customer.note,
      latitude: customer.latitude,
      longitude: customer.longitude,
      items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Impossible d'enregistrer la commande.");
  }
  try {
    localStorage.setItem("wuta_customer_v1", JSON.stringify({ name: customer.name, phone: customer.phone }));
  } catch (e) {}
  return data;
}
