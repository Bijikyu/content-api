// This file defines an Express router for the Azure service, including a test route and a translation route.
// It also includes configuration loading and body parsing middleware setup.

var azure = require('express').Router({
  mergeParams: true
}); // Create a new Express router instance with options to merge parameters from parent routes
const path = require('path'); // Require the path module to handle file paths
var bodyParser = require('body-parser') // Require the body-parser module to parse incoming request bodies
var jsonParser = bodyParser.json() // Create a middleware to parse JSON bodies

// Import a helper module for Azure operations
const azureHelper = require('./azureHelper.js');

// Load configuration from a JSON file located in the APPDATA directory
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json"));

// Retrieve the API key from the loaded configuration or set it to an empty string if not found
const apiKey = conf.settings.azure.api_key || "";

// Define a test route for the Azure router
azure.get('/', (req, res) => {
  res.status(200).json({
    message: 'Azure Router!'
  });
});

// Define a route to handle translation requests using the POST method
azure.post('/translate', jsonParser, function(req, res) {
  var event = req.body; // Store the parsed JSON body of the request in a variable
  console.log(event); // Log the event to the console
  azureHelper.translate(event, apiKey, function(err, data) { // Call the translate function from the azureHelper module
    if (err) {
      res.status(500).send(err); // Send a 500 error response if an error occurs
    } else {
      console.log(data); // Log the translation data to the console
      res.json(data); // Send the translation data as a JSON response
    }
  });
});

module.exports = azure; // Export the azure router for use in other modules
