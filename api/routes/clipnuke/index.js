// This module sets up an Express router with specific configurations and routes for the clipnuke application.
var clipnuke = require('express').Router({
  mergeParams: true
}); // Create an Express router instance with options to merge parameters from parent routers
var bodyParser = require('body-parser') // Require the body-parser module to parse incoming request bodies
var cookieParser = require('cookie-parser') // Require the cookie-parser module to parse cookies attached to the client request object
var bearerToken = require('express-bearer-token') // Require the express-bearer-token module to extract bearer tokens from HTTP headers
var jsonParser = bodyParser.json() // Create a middleware to parse JSON bodies
// var influx = require('./influx'); // Require the InfluxDB module (currently commented out)
var upload = require('./upload'); // Require the upload module for handling file uploads

// clipnuke Helper
const cn = require('./cnHelper.js'); // Require a helper module specific to clipnuke

// Middleware
clipnuke.use(cookieParser()) // Use cookieParser middleware to parse cookies
clipnuke.use(bearerToken()); // Use bearerToken middleware to extract bearer tokens

// Test Route
clipnuke.get('/', (req, res) => {
  res.status(200).json({
    message: 'clipnuke Router!'
  });
}); // Define a test route that responds with a JSON message

// Route for fetching trailers
clipnuke.get('/trailers', function(req, res) {
  var event = req.body; // Assign the request body to a variable 'event'

  const params = {
    // Define parameters to be used (currently commented out)
  };

  cn.getTrailerObjectKeys(params, function(err, data) {
    console.log(data); // Log the data received from the helper function
    res.json(data); // Respond with the data in JSON format
  });

});

// Route for fetching videos
clipnuke.get('/videos', function(req, res) {
  var event = req.body; // Assign the request body to a variable 'event'

  const params = {
    // Define parameters to be used (currently commented out)
  };

  cn.getVideoObjectKeys(params, function(err, data) {
    console.log(data); // Log the data received from the helper function
    res.json(data); // Respond with the data in JSON format
  });

});

// Route for fetching VODs (Video on Demand)
clipnuke.get('/vods', function(req, res) {
  var event = req.body; // Assign the request body to a variable 'event'

  const params = {
    // Define parameters to be used (currently commented out)
  };

  cn.getVodObjectKeys(params, function(err, data) {
    console.log(data); // Log the data received from the helper function
    res.json(data); // Respond with the data in JSON format
  });

});

// Route for fetching bucket information
clipnuke.get('/buckets', function(req, res) {
  var event = req.body; // Assign the request body to a variable 'event'
  console.log('Cookies: ', req.cookies) // Log the cookies received in the request

  const params = {
    // Define parameters to be used (currently commented out)
  };

  cn.getBuckets(params, function(err, data) {
    console.log(data); // Log the data received from the helper function
    res.json(data); // Respond with the data in JSON format
  });

});

// Test route to check token retrieval
clipnuke.get('/test', function(req, res) {
  var event = req.body; // Assign the request body to a variable 'event'
  console.log('Cookies: ', req.cookies) // Log the cookies received in the request
  console.log('Token: ', req.token) // Log the bearer token received in the request

  res.send('Token ' + req.token); // Respond with the token in plain text format

});

// Router export
// clipnuke.use('/sales', sales); // Mount the sales router (currently commented out)
// clipnuke.use('/influx', influx); // Mount the InfluxDB router (currently commented out)
clipnuke.use('/upload', upload); // Mount the upload router for handling file uploads

module.exports = clipnuke; // Export the clipnuke router for use in other modules