// This file sets up an Express router for handling routes related to 'xvideos' functionality.
// It includes routes for uploading, managing uploads, and spawning child processes to handle video posting.
// The router uses middleware for parsing JSON request bodies and interacts with a helper module and a WebDriver client.

var xvideos = require('express').Router({
  mergeParams: true
}); // Create a new Express router instance with options to merge parameters from parent router

var bodyParser = require('body-parser'); // Require the body-parser module to parse incoming request bodies
var jsonParser = bodyParser.json(); // Create a middleware to parse JSON request bodies
const path = require('path'); // Require the path module to work with file and directory paths
const spawn = require('child_process').spawn; // TODO Change to fork - Require the spawn function from the child_process module to create child processes
var cp = require('child_process'); // Require the child_process module to create and manage child processes

// Helper module for xvideos functionality
const xv = require('./xvHelper.js'); // Require a helper module for xvideos functionality

// Webdriver Client Instance
const client = require('../../webdriverio/client.js').client; // Require a WebDriver client instance for browser automation

// Test Route
xvideos.get('/', (req, res) => {
  res.status(200).json({
    message: 'Xvideos Router!'
  }); // Define a GET route for the root path that sends a JSON response with a message
});

// route to trigger the capture
xvideos.get('/uploads', function(req, res) {
  var id = req.params.id; // Retrieve the 'id' parameter from the request parameters
  console.log(`GET /uploads - Mock Endpoint`); // Log a message indicating this is a mock endpoint for GET /uploads
  res.json({}); // Send an empty JSON response
});

// route to trigger the capture
xvideos.post('/uploads', jsonParser, function(req, res) {
  var event = req.body; // Retrieve the request body as 'event'
  console.log(`POST /uploads - Mock Endpoint`); // Log a message indicating this is a mock endpoint for POST /uploads
  console.log(JSON.stringify(event, null, 2)); // Log the stringified 'event' object with indentation for readability
  var credentials = {
    user: conf.settings.xvideos.user,
    pass: conf.settings.xvideos.pass
  }; // Define credentials using user and pass from the configuration settings
  const params = {
    client: client,
    cookie: cookie
  }; // Define parameters including the WebDriver client and a cookie
  xv.login(credentials, params, function(err, data) {
    xv.postUpload(event, params, function(err, data) {
      console.log(data); // Log the data received from the postUpload function
      res.json(data); // Send the received data as a JSON response
    });
  });
});

xvideos.post('/spawn', jsonParser, (req, res) => {
  const event = req.body; // Retrieve the request body as 'event'
  var child = cp.fork(path.join(__dirname, 'postVideo.js'), [JSON.stringify(event)]); // Fork a new Node.js process to run 'postVideo.js' with the 'event' as an argument
  child.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`); // Log the exit code of the child process
  });
  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`); // Log data received from the child process's stdout
  });
  child.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`); // Log data received from the child process's stderr
  });
});

// route to trigger the capture
xvideos.get('/uploads/:id', function(req, res) {
  var id = req.params.id; // Retrieve the 'id' parameter from the request parameters
  console.log(`Requesting Upload ID: ${id}`); // Log a message with the requested upload ID
  var credentials = {
    user: conf.settings.xvideos.user,
    pass: conf.settings.xvideos.pass
  }; // Define credentials using user and pass from the configuration settings
  const params = {
    client: client,
    cookie: cookie
  }; // Define parameters including the WebDriver client and a cookie

  xv.login(credentials, params, function(err, data) {

    xv.getUpload(id, params, function(err, data) {
      console.log(data); // Log the data received from the getUpload function
      res.json(data); // Send the received data as a JSON response
    });

  });

});

// route to trigger the capture
xvideos.put('/uploads/:id', function(req, res) {
  var id = req.params.id; // Retrieve the 'id' parameter from the request parameters
  console.log(`PUT /uploads/${id} - Mock Endpoint`); // Log a message indicating this is a mock endpoint for PUT /uploads/:id
  res.json({}); // Send an empty JSON response
});

// route to trigger the capture
xvideos.delete('/uploads/:id', function(req, res) {
  var id = req.params.id; // Retrieve the 'id' parameter from the request parameters
  console.log(`DELETE /uploads/${id} - Mock Endpoint`); // Log a message indicating this is a mock endpoint for DELETE /uploads/:id
  res.json({}); // Send an empty JSON response
});

module.exports = xvideos; // Export the xvideos router to be used by other modules
