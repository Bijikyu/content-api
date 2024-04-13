// This module sets up a router for handling sales-related routes using Express and includes various dependencies and helper functions.

var sales = require('express').Router({
  mergeParams: true
}); // creates a new router instance for sales routes, with options to merge parameters from parent routes
const path = require('path'); // includes the path module for handling file paths
var bodyParser = require('body-parser') // includes the body-parser middleware for parsing request bodies
var jsonParser = bodyParser.json() // creates a middleware for parsing JSON request bodies

// Helper modules for handling sales and Clips4Sale integration
const c4s = require('../c4sHelper.js'); // includes the c4sHelper module for Clips4Sale related functions
const salesHelper = require('./salesHelper.js'); // includes the salesHelper module for additional sales-related functions

// Configuration file loading
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // loads the configuration file from the specified path

// Route definition for the sales endpoint
sales.get('/', (req, res) => { // defines a GET route on the root path of the sales router
  // Webdriver Client Instance
  const client = require('../../../webdriverio/client.js').client; // includes the webdriver client instance for browser automation
  const credentials = {
    user: conf.settings.clips4sale.user, // sets the username from the configuration file
    pass: conf.settings.clips4sale.pass, // sets the password from the configuration file
    phpsessid: conf.settings.clips4sale.phpsessid // sets the PHPSESSID from the configuration file
  };
  const params = {
    client: client // sets the client instance for use in the c4s helper functions
  };

  // Login to Clips4Sale and fetch sales report
  c4s.login(credentials, params, function(err, data) { // calls the login function from the c4s helper with the credentials and params
    if (err) {
      res.status(401).send('Login Error.', err); // sends a 401 status code with a login error message if there is an error
    }
    console.log("Logged in"); // logs to the console that login was successful
    salesHelper.getReport(credentials, params, req.query, function(err, data) { // calls the getReport function from the sales helper with the credentials, params, and query parameters
      if (err) {
        console.log(err); // logs any errors to the console
        res.send(401, err); // sends a 401 status code with the error if there is an error
      } else {
        console.log(data); // logs the data to the console
        res.json(data); // sends the data as a JSON response
      }
    });
  });
  /*   salesHelper.getReport(req.query, (err, data) => {
  	if (err) { callback(err, data); };
  	console.log(data);
  	res.status(200).json(data);
    }); */
});

module.exports = sales; // exports the sales router for use in other modules