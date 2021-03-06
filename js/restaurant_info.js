let restaurant;
var newMap;
let review;

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
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  const submitReview = document.querySelector('.submit-review');
  submitReview.addEventListener('click', addReview);

  window.addEventListener('online', isOnline);
  window.addEventListener('offline', isOffline);
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
   
  }
}
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  var isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favorite = document.createElement("button");
  favorite.setAttribute('role', 'switch');
  favorite.setAttribute('aria-checked', isFavorite);
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
    favorite.setAttribute('aria-checked', isFavorite);
    if (isFavorite){
    favorite.setAttribute('aria-label',`${restaurant.name} is a favorite restaurant`);
  }else{
      favorite.setAttribute('aria-label',`${restaurant.name} is not a favorite restaurant`);
  }
  };
   name.append(favorite);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  
  /*Picture element for providing appropriate responsive image*/
  const picture=document.getElementById('restaurant-picture');
  const source = document.querySelector('source');
  /*Browser that support webp will use the appropriate image based on width*/
  source.srcset=`/img/${restaurant.id}.webp 800w, /img/${restaurant.id}-600.webp 600w, /img/${restaurant.id}-400.webp 400w`;
  
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  
  /*Browser that does not support webp will use the appropriate jpeg image based on width*/
  image.srcset = `/img/${restaurant.id}.jpg 800w, /img/${restaurant.id}-600.jpg 600w, /img/${restaurant.id}-400.jpg 400w`;
  
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}
 /**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  /*For semantically correct code*/
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.insertAdjacentElement('afterbegin', title);
  const restaurantId = self.restaurant.id;
  DBHelper.fetchRestaurantReviewsById(restaurantId)
    .then(reviews => {
      if (!reviews) {
        const noReview = document.createElement('p');
        noReview.innerHTML = 'No reviews yet!';
        container.insertAfter(noReview, title);
        return;
      }
      const ul = document.getElementById('reviews-list');
      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
    })
}
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
    li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);
  
  /*Star icons to make UI more interactive*/

  const rating = document.createElement('span');
  rating.className=`star-${review.rating}`;
 
  /*Hidding from users with accessibilty issues*/
  rating.setAttribute('aria-hidden',"true");
  rating.setAttribute('title',"User Rating");
  
  /*For screen reader use */
  const srspan=document.createElement('span');
  /*To visually hide the element from all user */
  /*But made accessible to screen readers*/
  srspan.className='visuallyhidden';
  srspan.innerHTML=`Rating ${review.rating}`;

  li.appendChild(rating);
  li.appendChild(srspan);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}


/**
 * Add review entered by user.
 */
const addReview = (event) => {
  const name = document.querySelector('.name');
  const rating = document.querySelector('.rating');
  const comments = document.querySelector('.comments');

  const review = {
    "restaurant_id": self.restaurant.id,
    "name": name.value,
    "rating": rating.value,
    "comments": comments.value,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString()
  };
  console.log("payload",review);
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  DBHelper.postReviewToDB(review);
  resetReviewForm(name, rating, comments);
};

/**
 * Reset review form.
 */
const resetReviewForm = (name, rating, comments) => {
  name.value = '';
  rating.value = '';
  comments.value = 'Enter Comments';
};

/**
 * Sync reviews with server.
 */
const syncReviewsWithServer = () => {
  Promise.all(window.reviewsToBeSynced.map(review => {
    DBHelper.postReviewToServer(review);
  })).then(_ => {
    alert('Background Sync for reviews completed');
    window.reviewsToBeSynced.length = 0;
  }).catch(_ => {
    window.reviewsToBeSynced.length = 0;
  });
};

/**
 * Alert when restaurant reviews page is online.
 */
const isOnline = (event) => {
  alert('Application Is Now Online, Sync Will Continue.');
  syncReviewsWithServer();
};

/**
 * Alert when restaurant reviews page is offline.
 */
const isOffline = (event) => {
  alert('Application Is Offline, Data will be saved for background sync ');
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/* Toggle form
*/
function toggleForm() {
  var form=document.getElementById("review-form");
  var button=document.getElementById("add-review") 
  if (form.style.display == 'none'|| form.style.display == '') {
    form.style.display = 'block';
    button.style.marginBottom='1rem';
  } else {
    form.style.display = 'none';
    button.style.marginBottom='5rem';
  }
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
