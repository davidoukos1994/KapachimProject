// Kapachim Project v8 - no offline cache; Supabase data must stay fresh.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));
