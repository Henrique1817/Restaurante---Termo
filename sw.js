// Service Worker para cache offline
// Arquivo opcional - descomente o registro no main.js para ativar

/* Configuração de nomes dos caches */
const CACHE_NAME = 'restaurante-termo-v1.0.0'; // Cache principal
const STATIC_CACHE = 'static-v1'; // Cache de arquivos estáticos
const DYNAMIC_CACHE = 'dynamic-v1'; // Cache de arquivos dinâmicos

/* Arquivos para cache estático (sempre disponíveis offline) */
const STATIC_FILES = [
  '/',
  '/index.html',
  '/assets/css/critical.css',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/css/extras.css'
];

/* Diretórios para cache dinâmico (imagens, etc) */
const DYNAMIC_FILES = [
  '/assets/images/'
];

/* Evento de instalação - armazena arquivos estáticos no cache */
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  
  // Aguarda o processo de cache terminar antes de continuar
  event.waitUntil(
    caches.open(STATIC_CACHE) // Abre o cache estático
      .then(cache => {
        console.log('SW: Caching static files');
        return cache.addAll(STATIC_FILES); // Adiciona todos os arquivos estáticos
      })
      .then(() => {
        console.log('SW: Static files cached');
        return self.skipWaiting(); // Força ativação imediata
      })
      .catch(error => {
        console.error('SW: Error caching static files', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('SW: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Clone request for cache
        const fetchRequest = request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for cache
            const responseToCache = response.clone();
            
            // Determine cache type
            const isStaticFile = STATIC_FILES.some(file => request.url.includes(file));
            const isDynamicFile = DYNAMIC_FILES.some(path => request.url.includes(path));
            
            if (isStaticFile) {
              caches.open(STATIC_CACHE)
                .then(cache => {
                  console.log('SW: Caching static file', request.url);
                  cache.put(request, responseToCache);
                });
            } else if (isDynamicFile || request.url.includes('/assets/')) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  console.log('SW: Caching dynamic file', request.url);
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(error => {
            console.error('SW: Fetch failed', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return placeholder for images
            if (request.destination === 'image') {
              return new Response(
                '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">Imagem indisponível</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            return new Response('Conteúdo indisponível offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for form submissions (if supported)
self.addEventListener('sync', event => {
  console.log('SW: Background sync', event.tag);
  
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  } else if (event.tag === 'reservation-form') {
    event.waitUntil(syncReservationForm());
  }
});

// Sync functions
async function syncContactForm() {
  try {
    // Get stored form data from IndexedDB
    const formData = await getStoredFormData('contact-form');
    if (formData) {
      // Submit form data
      await submitFormData('/api/contact', formData);
      // Clear stored data
      await clearStoredFormData('contact-form');
      console.log('SW: Contact form synced');
    }
  } catch (error) {
    console.error('SW: Contact form sync failed', error);
  }
}

async function syncReservationForm() {
  try {
    // Get stored form data from IndexedDB
    const formData = await getStoredFormData('reservation-form');
    if (formData) {
      // Submit form data
      await submitFormData('/api/reservations', formData);
      // Clear stored data
      await clearStoredFormData('reservation-form');
      console.log('SW: Reservation form synced');
    }
  } catch (error) {
    console.error('SW: Reservation form sync failed', error);
  }
}

// Helper functions for IndexedDB operations
function getStoredFormData(formType) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RestauranteTermoDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['forms'], 'readonly');
      const store = transaction.objectStore('forms');
      const getRequest = store.get(formType);
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('forms')) {
        db.createObjectStore('forms');
      }
    };
  });
}

function clearStoredFormData(formType) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RestauranteTermoDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['forms'], 'readwrite');
      const store = transaction.objectStore('forms');
      const deleteRequest = store.delete(formType);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

function submitFormData(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}

// Push notification handling (optional)
self.addEventListener('push', event => {
  console.log('SW: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova mensagem do Restaurante Termo',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    tag: 'restaurante-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/assets/images/view-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/images/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Restaurante Termo', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});