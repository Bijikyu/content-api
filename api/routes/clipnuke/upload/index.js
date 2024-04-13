// This file defines an Express router for handling upload-related routes and includes middleware for parsing JSON request bodies.

var upload = require('express').Router({
  mergeParams: true
}); // Creates a new router instance for handling upload routes with merged parameter options
var bodyParser = require('body-parser') // Requires the body-parser module to parse incoming request bodies
var jsonParser = bodyParser.json() // Creates a middleware that parses JSON request bodies

// upload Helper
const uploadHelper = require('./uploadHelper.js'); // Requires a module to assist with upload functionality

// Test Route
upload.get('/', (req, res) => { // Defines a GET route on the root path of the upload router
  res.status(200).json({ // Sends a JSON response with status code 200
    message: 'upload Router!' // The JSON object sent as a response
  });
});

// Handles POST requests to the /trailers endpoint
upload.post('/trailers', function(req, res) { // Defines a POST route for uploading trailers
  var event = req.body; // Assigns the parsed JSON request body to the variable event

  const params = { // Defines an object to hold parameters for getTrailerObjectKeys function
    // accessKey: event.accessKey,
    // secretKey: event.secretKey
  };

  cn.getTrailerObjectKeys(params, function(err, data) { // Calls a function to get trailer object keys with the given parameters
    console.log(data); // Logs the data returned from getTrailerObjectKeys to the console
    res.json(data); // Sends the data as a JSON response
  });

});

// Handles POST requests to the /videos endpoint
upload.post('/videos', function(req, res) { // Defines a POST route for uploading videos
  var event = req.body; // Assigns the parsed JSON request body to the variable event

  const params = { // Defines an object to hold parameters for getVideoObjectKeys function
    // accessKey: event.accessKey,
    // secretKey: event.secretKey
  };

  cn.getVideoObjectKeys(params, function(err, data) { // Calls a function to get video object keys with the given parameters
    console.log(data); // Logs the data returned from getVideoObjectKeys to the console
    res.json(data); // Sends the data as a JSON response
  });

});

// Handles POST requests to the /thumbnails endpoint
upload.post('/thumbnails', function(req, res) { // Defines a POST route for uploading thumbnails
  var event = req.body; // Assigns the parsed JSON request body to the variable event
  console.log('Cookies: ', req.cookies) // Logs the cookies associated with the request to the console

  const params = { // Defines an object to hold parameters for getBuckets function
    // accessKey: event.accessKey,
    // secretKey: event.secretKey
  };

  cn.getBuckets(params, function(err, data) { // Calls a function to get bucket information with the given parameters
    console.log(data); // Logs the data returned from getBuckets to the console
    res.json(data); // Sends the data as a JSON response
  });

});

// The following commented-out lines are placeholders for additional middleware or routes that may be used in the future.
// upload.use('/sales', sales);

// upload.use('/influx', influx);

module.exports = upload; // Exports the upload router for use in other parts of the application