// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("Service Worker activated");
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag,
    requireInteraction: true,
    actions: [
      {
        action: "start",
        title: "Start Task",
        icon: "/favicon.ico",
      },
      {
        action: "postpone",
        title: "Later",
        icon: "/favicon.ico",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "start") {
    // Focus the app and send start command
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/") && "focus" in client) {
            client.postMessage({
              action: "startTask",
              taskId: event.notification.tag,
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
    );
  } else if (event.action === "postpone") {
    // Focus the app and send postpone command
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/") && "focus" in client) {
            client.postMessage({
              action: "postponeTask",
              taskId: event.notification.tag,
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
    );
  } else {
    // Default click behavior
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/") && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
    );
  }
});
