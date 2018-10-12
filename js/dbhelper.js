/**
 * Common database helper functions.
 */
window.reviewsToBeSynced = [];
class DBHelper {

    /*
      Development Sever
    */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL(){
    const port = 1337 
    return `http://localhost:${port}/reviews`; 
  }

 static get dbPromise() {
    return DBHelper.openDatabase();
  }
  /*
    Initialising Database  
  */
  static openDatabase(data){
    // If browser does not support idb return
    if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
    }
    return idb.open('restaurant-db', 2, function(upgradeDB){
      switch (upgradeDB.oldVersion) {
      case 0:
      var restaurantstore=upgradeDB.createObjectStore('restaurant',{
      keyPath:'id',
      autoIncrement:true
      });
      case 1:
      var reviewstore=upgradeDB.createObjectStore('reviews');
      }
      });
  };
 
  /*
    Update data in DB 
  */
  static updateDB(data,dbpromise){
  return dbpromise.then(function(db){
  var tx=db.transaction('restaurant','readwrite');
  var restaurantstore=tx.objectStore('restaurant');
   data.forEach(function(item) {
      restaurantstore.put(item);
      tx.complete;
    });
    });   
  }  
  /*
    Get Restaurants from db for offline use
  */
static fetchfromDb(data) {
    return data.then(function(db) {
      if (!db) return;
      let tx = db.transaction('restaurant');
      let restaurantstore = tx.objectStore('restaurant');
      return restaurantstore.getAll();
    });
  }

   
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const dbpromise = DBHelper.openDatabase();
    // For offline check
    DBHelper.fetchfromDb(dbpromise)
      .then((restaurants) => {
        if (restaurants.length>0) {
          callback(null, restaurants);
        }else {
          // Fetching from development server
          fetch(DBHelper.DATABASE_URL)
          .then((response) =>{
            if(!response.ok){
            throw response.statusText;
            }
          return response.json();
          }).then((restaurants) =>{
            DBHelper.updateDB(restaurants,dbpromise);
            callback(null, restaurants);
          }).catch((error) => {
          callback(error, null); 
        });
    }
  });
 }     
 
  /**
   * Fetch a restaurant by its ID.
   */
    static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
  /**
   * Fetch reviews by restaurant ID 
   */
  static getReviewsFromDb(dbPromise, restaurantId) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews');
      let reviewsStore = tx.objectStore('reviews');
      return reviewsStore.get(restaurantId);
    });
  }

  /**
   * Update reviews in reviews db.
   */
  static updateReviewsInDb(dbPromise, restaurantId, reviews) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews', 'readwrite');
      let reviewsStore = tx.objectStore('reviews');
      reviewsStore.put(reviews, restaurantId);
      tx.complete;
    });
  }

  /**
   * Fetch all reviews for a particular restaurant.
   */
  static fetchRestaurantReviewsById(restaurantId) {
    const reviewsUrl = `${this.REVIEWS_URL}/?restaurant_id=${restaurantId}`;
    const dbPromise = DBHelper.openDatabase();

    if (navigator.onLine) {
      // Network then cache
      return fetch(reviewsUrl)
        .then(response => response.json())
        .then(reviews => {
          if (!reviews) throw new Error('Reviews not found');
          // Update Reviews in DB by Restaurant
          DBHelper.updateReviewsInDb(dbPromise, restaurantId, reviews);
          return reviews;
        }).catch(e => {
          return DBHelper.getReviewsFromDb(dbPromise, restaurantId)
            .then(reviews => {
              if (reviews && reviews.length > 0) {
                return reviews;
              };
            });
        });
    } else {
      // Cache then network strategy
      return DBHelper.getReviewsFromDb(dbPromise, restaurantId)
        .then(reviews => {
          if (reviews && reviews.length > 0) {
            return reviews;
          } else {
            // Fetch reviews from network.
            return fetch(reviewsUrl)
              .then(response => response.json())
              .then(reviews => {
                if (!reviews) return;
                DBHelper.updateReviewsInDb(dbPromise, restaurantId, reviews);
                return reviews;
              });
          }
        }).catch((error) => {
          console.log(`Request failed with error: ${error}`);
        });
    }

  }

   /**
   * Update IndexedDB with latest review before going online.
   */
  static postReviewToDB(review) {
    const dbPromise = DBHelper.openDatabase();

    DBHelper.getReviewsFromDb(dbPromise, review.restaurant_id)
      .then(reviews => {
        if (!reviews) return;
        reviews.push(review);
        DBHelper.updateReviewsInDb(dbPromise, review.restaurant_id, reviews);

        if (navigator.onLine) {
          DBHelper.postReviewToServer(review);
        } else {
          window.reviewsToBeSynced.push(review);
        }

      });
  }

  /**
   * Update server with latest review.
   */
  static postReviewToServer(review) {
    const postReviewsUrl = `http://localhost:1337/reviews`;

    const postReview = {
      "restaurant_id": review.restaurant_id,
      "name": review.name,
      "rating": review.rating,
      "comments": review.comments
    };

    return fetch(postReviewsUrl, {
      method: 'POST',
      body: JSON.stringify(postReview),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

    static FavouriteRestaurantNetwork({ id, is_favorite }) {
    fetch(`${this.DATABASE_URL}/${id}/?is_favorite=${!is_favorite}`,
      {
        method: 'PUT',
      }
    ).then(response => response.json())
     .then(data => console.log(data));
  }

  static handleFavoriteClick(db, restaurant) {
    let tx, store;
    tx = db.transaction('restaurant', 'readwrite');
    store = tx.objectStore('restaurant');
    restaurant.is_favorite = !restaurant.is_favorite;
    store.put(restaurant);
    return tx.complete;
  }

  static markFavorite(restaurant) {
    if ('indexedDB' in window) {
      this.dbPromise.then(db => {
        if (db) {
           this.handleFavoriteClick(db, restaurant);
        }
      });
    }
     this.FavouriteRestaurantNetwork(restaurant);
  }; 
  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
}

