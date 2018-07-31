var staticCacheName='restaurant-static-v1';
var contentImgsCache='restaurant-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];
/*Handling install and caching all static files*/ 
self.addEventListener('install',function(event){
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache){
			return cache.addAll([
				'index.html',
				'restaurant.html',
				'js/idb.js',
        'js/main.min.js',
				'js/restaurant_info.min.js',
				'js/dbhelper.min.js',
				'css/styles.min.css',
				]);
			})
		);
	
});

/*Deleting old cache*/
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


/*Serving content from cache incase of network failure*/
/*And adding items to cache in case of network*/
self.addEventListener('fetch', function(event) {
   
   if (event.request.url.endsWith('.webp') || event.request.url.endsWith('.jpg')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
 // For local URLs
 event.respondWith(
    caches.open(staticCacheName).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  ); 
  });      

function servePhoto(request) {
  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(request).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
