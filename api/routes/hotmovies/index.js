// This module sets up an Express router for handling HTTP POST requests to the '/hotmovies' endpoint.
// It uses the 'body-parser' middleware to parse JSON request bodies and includes a helper module for uploading data.
// Configuration is loaded from a JSON file located in the user's APPDATA directory.

var hotmovies = require('express').Router({
  mergeParams: true
}); // create a new router instance with options to merge parameters from parent router
const path = require('path'); // require the path module for handling and transforming file paths
var bodyParser = require('body-parser'); // require the body-parser middleware to parse request bodies
var jsonParser = bodyParser.json(); // create a middleware to parse JSON request bodies

// clips4sale Helper
const hotmoviesHelper = require('./hotmoviesHelper.js'); // require the hotmoviesHelper module for uploading functionality

const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // load configuration from a JSON file in the APPDATA directory

// Define the POST endpoint for the '/hotmovies' route
hotmovies.post('/', jsonParser, function(req, res) {
  var event = req.body; // store the parsed JSON request body in a variable
  const credentials = {
    user: conf.settings.hotmovies.user, // extract the user credential from the configuration
    pass: conf.settings.hotmovies.pass  // extract the password credential from the configuration
  };
  // console.log(req, res);
  event.credentials = []; // initialize an empty array to store credentials
  event.credentials.push(credentials); // add the extracted credentials to the event object
  console.log(event); // log the event object to the console
  hotmoviesHelper.upload(req.body, function(err, data) { // call the upload function from hotmoviesHelper with the request body
    if (err) {
      callback(err, data); // if an error occurs, call the callback function with the error and data
    } else {
      console.log(data); // log the successful data response to the console
      res.status(200).json(data); // send a 200 OK response with the JSON data
    }
  });
  // console.log(req.body);      // your JSON
  // res.send(req.body);    // echo the result back
});

module.exports = hotmovies; // export the hotmovies router for use in other modules
