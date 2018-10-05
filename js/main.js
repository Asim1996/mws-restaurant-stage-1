let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []


/*Service Worker Registration */
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(function(){
      console.log("Registration worked!");
    })
    .catch(function(){
      console.log("Registration Failed!");
    });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibWV0YWxpbmd1cyIsImEiOiJjamlkMmtveHQwMnlrM3dveTU5MHF4Y3liIn0.uBfa5-js-MdO-UbmNwv6gA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};

updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  // For getting focus on each element
  li.setAttribute('tabindex',"0");
  /*Picture element for getting appropriate image based on browser support*/
  const picture = document.createElement('picture');
  
  const source = document.createElement('source');
  /*Browser that support webp will use the appropriate image based on width*/
  source.srcset=`/img/${restaurant.id}.webp 800w, /img/${restaurant.id}-600.webp 600w, /img/${restaurant.id}-400.webp 400w`;
  
  source.type="image/webp";
  
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
 
  /*Browser that does not support webp will use the appropriate jpeg image based on width*/
  image.srcset = `/img/${restaurant.id}.jpg 800w, /img/${restaurant.id}-600.jpg 600w, /img/${restaurant.id}-400.jpg 400w`;
  
  image.alt=`${restaurant.name} restaurant photograph`;
    
  picture.append(source);
  picture.append(image);
  li.append(picture);

  /*Making the page Semantically correct*/
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);
  
  var isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favorite = document.createElement("button");
  favorite.setAttribute('role', 'switch');
  favorite.id=`${restaurant.id}`;
  favorite.classList.add('heart');
  if (isFavorite){
    favorite.classList.add('favorite-checked');
    favorite.setAttribute('aria-label',`${restaurant.name} is a favorite restaurant`);
  }else{
      favorite.setAttribute('aria-label',`${restaurant.name} is not a favorite restaurant`);
  } 
  favorite.onclick = (e) => {
    DBHelper.markFavorite(restaurant);
    favorite.classList.toggle('favorite-checked');
    isFavorite=!isFavorite;
    if (isFavorite){
    favorite.setAttribute('aria-label',`${restaurant.name} is a favorite restaurant`);
  }else{
      favorite.setAttribute('aria-label',`${restaurant.name} is not a favorite restaurant`);
  }
  };
  name.append(favorite);
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  /*aria-label for a better understanding for user with screenreaders*/
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label',`Address ${restaurant.address}`);
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label',`More details of ${restaurant.name}`);
  li.append(more);

  return li;
};

/** Add markers for current restaurants to the map.*/
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
};


