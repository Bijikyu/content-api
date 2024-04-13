// This module sets up an Express router for handling API requests related to the 'aebn' endpoint and includes middleware for parsing JSON request bodies. It also integrates a helper module for uploading data and reads configuration from a JSON file.

var aebn = require('express').Router({
  mergeParams: true
}); // creates a new router instance for handling requests with merged parameter options

var path = require('path'); // includes the 'path' module to work with file and directory paths
var bodyParser = require('body-parser'); // includes the 'body-parser' middleware to parse request bodies
var jsonParser = bodyParser.json(); // creates a middleware for parsing JSON formatted request bodies

// clips4sale Helper
const aebnHelper = require('./aebnHelper.js'); // includes the 'aebnHelper' module for additional functionality

const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // loads the configuration file from the specified path in the APPDATA environment variable

// Route handler for POST requests to the root of the 'aebn' router
aebn.post('/', jsonParser, function(req, res) {
  var event = req.body; // assigns the parsed JSON request body to the 'event' variable
  const credentials = {
    user: conf.settings.aebn.user, // retrieves the 'user' credential from the configuration file
    pass: conf.settings.aebn.pass // retrieves the 'pass' credential from the configuration file
  };
  // console.log(req, res);
  event.credentials = []; // initializes an empty array for credentials in the 'event' object
  event.credentials.push(credentials); // adds the 'credentials' object to the 'event.credentials' array
  console.log(event); // logs the 'event' object to the console
  aebnHelper.localUpload(req.body, function(err, data) { // calls the 'localUpload' function from the 'aebnHelper' module with the request body and a callback function
    if (err) {
      callback(err, data); // if an error occurs, calls the callback function with the error and data
    } else {
      console.log(data); // logs the returned 'data' to the console if no error occurs
      res.status(200).json(data); // sends a 200 OK response with the 'data' in JSON format
    }
  });
  // console.log(req.body);      // your JSON
  // res.send(req.body);    // echo the result back
});

module.exports = aebn; // exports the 'aebn' router module for use in other parts of the application