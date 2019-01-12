# Mobile Web Specialist Certification Course
---
This project was built as a part of Udacity's Mobile Web Specialist Nanodegree.

The entire Nanodegree was carried out as a scholarship from Google and Udacity for the year 2018. 

Project Features
---
* The application uses **flexbox** and **media queries** for Responsive design pattern.

* **Accessibility** features such as semantic HTML, ARIA attributes and skip links were used to improve the accessibilty score of the application.

* For **performance optimization**, the styles were loaded asynchronously with the help of media and onload attributes of link tag and defer Parsing of Javascript was used. 

* Service Worker has been used extensively to cache all static files ( HTML, CSS, JavaScript,mapbox files). Images were cached too.

* IndexedDB was used to store the data of restaurant and reviews.

* Offline form submission was added.Even if user enters data while offline, The data is stored into IndexedDB while offline and then it goes to server on an active connection.

* Gulp was used for minification.

## Setup Guide
**Client Side**
   ```
   npm install
   ```
In a terminal, check the version of Python you have: python -V. If you have Python 2.x, spin up the server with python -m SimpleHTTPServer 8000 (or some other port, if port 8000 is already in use.) For Python 3.x, you can use python3 -m http.server 8000.   
The application will be running at http://localhost:8000/ .

**Server Side**

# Local Development API Server
## Usage
#### Get Restaurants
```
curl "http://localhost:1337/restaurants"
```
#### Get Restaurants by id
````
curl "http://localhost:1337/restaurants/{3}"
````

## Architecture
Local server
- Node.js
- Sails.js

## Getting Started

### Development local API Server
_Location of server = /server_
Server depends on [node.js LTS Version: v6.11.2 ](https://nodejs.org/en/download/), [npm](https://www.npmjs.com/get-npm), and [sails.js](http://sailsjs.com/)
Please make sure you have these installed before proceeding forward.

Great, you are ready to proceed forward; awesome!

Let's start with running commands in your terminal, known as command line interface (CLI)

###### Install project dependancies
```Install project dependancies
# npm i
```
###### Install Sails.js globally
```Install sails global
# npm i sails -g
```
###### Start the server
```Start server
# node server
```
### You should now have access to your API server environment
debug: Environment : development
debug: Port        : 1337

### Lighthouse Score
![Lighthouse Score](https://i.imgur.com/0amsJSS.png)

### Screenshots

![Index Page](https://i.imgur.com/q44zdJj.jpg)

![Desktop View](https://i.imgur.com/yAFvbOo.jpg)

![Restaurant Page](https://i.imgur.com/AZUykds.jpg)

![Landscape View](https://i.imgur.com/GSy1lwf.jpg)
