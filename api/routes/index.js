// This file sets up routing for an Express application, associating URL paths with specific router modules for handling requests.

const router = require('express').Router({ mergeParams: true }); // Create a new router object from Express, with options to merge parameters from parent routers
var manyvids = require('./manyvids'); // Require the ManyVids router module
var clips4sale = require('./clips4sale'); // Require the Clips4Sale router module
var xvideos = require('./xvideos'); // Require the Xvideos router module
// var google = require('./google'); // Require the Google router module (currently commented out)
var azure = require('./azure'); // Require the Azure router module
var clipnuke = require('./clipnuke'); // Require the Clipnuke router module
var woo = require('./woo'); // Require the WooCommerce router module
var pornhub = require('./pornhub'); // Require the Pornhub router module
var aebn = require('./aebn'); // Require the AEBN router module
var hotmovies = require('./hotmovies'); // Require the HotMovies router module
var adultempire = require('./adultempire'); // Require the AdultEmpire router module
var local = require('./local'); // Require the local router module

// Define route handlers for the ManyVids section of the application
router.use('/manyvids', manyvids); // Mount the ManyVids router on the '/manyvids' path

// Define route handlers for the Clips4Sale section of the application
router.use('/clips4sale', clips4sale); // Mount the Clips4Sale router on the '/clips4sale' path

// Define route handlers for the Xvideos section of the application
router.use('/xvideos', xvideos); // Mount the Xvideos router on the '/xvideos' path

// Define route handlers for the Google section of the application (currently disabled)
// router.use('/google', google); // Mount the Google router on the '/google' path (currently commented out)

// Define route handlers for the Azure section of the application
router.use('/azure', azure); // Mount the Azure router on the '/azure' path

// Define route handlers for the Clipnuke section of the application
router.use('/clipnuke', clipnuke); // Mount the Clipnuke router on the '/clipnuke' path

// Define route handlers for the WooCommerce section of the application
router.use('/woo', woo); // Mount the WooCommerce router on the '/woo' path

// Define route handlers for the Pornhub section of the application
router.use('/pornhub', pornhub); // Mount the Pornhub router on the '/pornhub' path

// Define route handlers for the AEBN section of the application
router.use('/aebn', aebn); // Mount the AEBN router on the '/aebn' path

// Define route handlers for the HotMovies section of the application
router.use('/hotmovies', hotmovies); // Mount the HotMovies router on the '/hotmovies' path

// Define route handlers for the AdultEmpire section of the application
router.use('/adultempire', adultempire); // Mount the AdultEmpire router on the '/adultempire' path

// Define route handlers for the local section of the application
router.use('/local', local); // Mount the local router on the '/local' path

module.exports = router; // Export the router object for use in other files
