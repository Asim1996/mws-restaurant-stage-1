var staticCacheName='restaurant-static-v1';
/*Handling install and caching all static files*/ 
self.addEventListener('install',function(event){
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache){
			return cache.addAll([
				'index.html',
				'restaurant.html',
				'js/main.js',
				'js/restaurant_info.js',
				'js/dbhelper.js',
				'css/styles.css',
				'data/restaurants.json',
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
                 cacheName != staticCacheName;
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





 