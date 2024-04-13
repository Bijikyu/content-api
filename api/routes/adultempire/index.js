// This module sets up an express router for handling requests related to the 'adultempire' service.
// It includes middleware for parsing JSON request bodies and uses a helper module for uploading data.
// Configuration is loaded from a JSON file located in the APPDATA directory.

var adultempire = require('express').Router({
  mergeParams: true
}); // create a new express router with options to merge parameters from parent routes

var path = require('path'); // require the path module to work with file and directory paths
var bodyParser = require('body-parser'); // require the body-parser middleware to parse request bodies
var jsonParser = bodyParser.json(); // create a middleware to parse JSON request bodies

// clips4sale Helper
const adultempireHelper = require('./adultempireHelper.js'); // require the helper module for adultempire

const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // load the configuration from a JSON file in the APPDATA directory

// Define the POST endpoint for the adultempire router
adultempire.post('/', jsonParser, function(req, res) {
  if (!req.headers.authorization || req.headers.authorization.split(' ')[0] !== 'Bearer') { // check if the authorization header is missing or not a Bearer token
    res.status(401).send('Missing Authentication Method.'); // send a 401 Unauthorized response if the check fails
  } else {
    var event = req.body; // store the request body in a variable named event
    const credentials = {
      user: conf.settings.adultempire.user, // extract the user credential from the configuration
      pass: conf.settings.adultempire.pass  // extract the password credential from the configuration
    };
    // console.log(req, res);
    event.credentials = []; // initialize an empty array for credentials in the event object
    event.credentials.push(credentials); // add the extracted credentials to the event object
    console.log(event); // log the event object to the console
    adultempireHelper.upload(req.body, function(err, data) { // call the upload function from the helper module with the request body and a callback
      if (err) {
        callback(err, data); // if an error occurs, call the callback function with the error and data
      } else {
        console.log(data); // if no error, log the data to the console
        res.status(200).json(data); // send a 200 OK response with the data in JSON format
      }
    });
    // console.log(req.body);      // your JSON
    // res.send(req.body);    // echo the result back
  }
});

module.exports = adultempire; // export the adultempire router for use in other modules