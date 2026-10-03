/* eslint-disable no-console */

export const register = () => {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.BASE_URL}service-worker.js`;
      
      console.info(`[ServiceWorker] Registering Service Worker, URL: ${swUrl}`);
      
      // Check existing Service Worker registrations
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.info('[ServiceWorker] Existing Service Worker registrations found, proceeding');
        }
        
        // Register Service Worker
        navigator.serviceWorker
          .register(swUrl)
          .then(registration => {
            console.info('[ServiceWorker] Service Worker registered successfully');
            
            // Listen for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker == null) {
                return;
              }
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content available, notify user
                    console.log('[ServiceWorker] New content available, please refresh');
                    const updateNotification = document.createElement('div');
                    updateNotification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #409EFF; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0,0,0,.1); z-index: 9999;';
                    updateNotification.innerHTML = '<div style="display: flex; align-items: center;"><span style="margin-right: 10px;">Mise \u00e0 jour disponible, rechargez la page</span><button style="background: white; color: #409EFF; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Actualiser</button></div>';
                    document.body.appendChild(updateNotification);
                    updateNotification.querySelector('button').addEventListener('click', () => {
                      window.location.reload();
                    });
                  } else {
                    // First install, content cached for offline
                    console.log('[ServiceWorker] Content cached for offline use');
                    setTimeout(() => {
                      const cdnUrls = [
                        'https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css',
                        'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
                        'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
                        'https://unpkg.com/vue-router@3.6.5/dist/vue-router.min.js',
                        'https://unpkg.com/vuex@3.6.2/dist/vuex.min.js',
                        'https://unpkg.com/element-ui@2.15.14/lib/index.js',
                        'https://unpkg.com/axios@0.27.2/dist/axios.min.js',
                        'https://unpkg.com/opus-decoder@0.7.7/dist/opus-decoder.min.js'
                      ];
                      cdnUrls.forEach(url => {
                        fetch(url, { mode: 'no-cors' }).catch(err => {
                          console.log(`Preload failed for ${url}`, err);
                        });
                      });
                    }, 2000);
                  }
                }
              };
            };
          })
          .catch(error => {
            console.error('Service Worker registration error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to register a ServiceWorker')) {
              console.warn('[ServiceWorker] Registration failed, CDN caching may be unavailable');
              if (process.env.NODE_ENV === 'production') {
                console.info('Tips: 1. Check MIME type 2. Verify SSL certificate 3. Check service-worker.js path');
              }
            }
          });
      });
    });
  }
};

export const unregister = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
};