// Service worker de messagerie WUTA.
// Rôle : recevoir les notifications push envoyées par le serveur et les
// afficher au niveau du système d'exploitation, même si aucun onglet du
// site n'est ouvert — c'est ce mécanisme qui remplace WhatsApp/SMS.

self.addEventListener("push", (event) => {
  let data = { title: "WUTA", body: "Vous avez un nouveau message.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    /* payload non-JSON, on garde les valeurs par défaut */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      // Ajoutez public/icon-192.png (et adaptez ici) pour une icône de marque ;
      // sans ça, le navigateur affiche son icône par défaut.
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if (win.url.includes(targetUrl) && "focus" in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
