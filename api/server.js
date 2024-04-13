// This is an IIFE (Immediately Invoked Function Expression) that encapsulates the server code to avoid polluting the global scope.
(function() {
  'use strict'; // Enforces stricter parsing and error handling in the code

  const express = require('express'); // Requires the Express framework for building web applications
  const cors = require('cors'); // Requires the CORS middleware to enable Cross-Origin Resource Sharing
  const path = require('path'); // Requires the Path module for handling and transforming file paths
  const fs = require('fs'); // Requires the File System module to work with the file system
  const router = require(path.join(__dirname, 'routes/')); // Requires the router module from the routes directory
  const https = require('https'); // Requires the HTTPS module to create an HTTPS server
  const app = express(); // Initializes a new Express application
  const client = require('./webdriverio/client.js').client; // Requires the WebDriverIO client for browser automation

  // Middleware to set a custom server signature
  app.use(function(req, res, next) {
    res.setHeader('X-Powered-By', 'ClipNuke.com') // Sets the X-Powered-By header to 'ClipNuke.com'
    next() // Passes control to the next middleware function
  })

  app.use(cors()); // Enables CORS for all routes

  // Connects all routes from the router to the application
  app.use('/', router);

  // Sets the JSON response formatting to use 2 spaces for indentation
  app.set('json spaces', 2);

  // Creates an HTTPS server with the provided SSL key and certificate, and starts listening on port 3000
  https.createServer({
      key: fs.readFileSync(path.join(__dirname, 'server.key')), // Reads the SSL key file
      cert: fs.readFileSync(path.join(__dirname, 'server.cert')), // Reads the SSL certificate file
    }, app)
    .listen(3000, '127.0.0.1', function() {
      console.log('ClipNuke Server listening on port 3000! Go to https://localhost:3000/') // Logs a message once the server is listening
    })

  // Defines an endpoint to restart the server
  app.get('/restart', function(req, res, next) {
    process.exit(1); // Exits the process with a 'failure' code
  });

  module.exports = app; // Exports the Express application for use in other modules

}());