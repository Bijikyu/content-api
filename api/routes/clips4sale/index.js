// This module sets up an Express router for handling API routes related to Clips4Sale operations.
const clips4sale = require('express').Router({
  mergeParams: true
}); // Create a new Express router instance with merged parameter options
const path = require('path'); // Import the path module for handling and transforming file paths
const fs = require('fs'); // Import the file system module for interacting with the file system
const sales = require(path.join(__dirname, 'sales')) // Import the sales module from the current directory
const ftp = require(path.join(__dirname, 'ftp')) // Import the ftp module from the current directory
const bodyParser = require('body-parser') // Import the body-parser middleware for parsing request bodies
const jsonParser = bodyParser.json() // Create a middleware for parsing JSON request bodies
const spawn = require('child_process').spawn; // Import the spawn function from the child_process module (TODO: Change to fork)
var cp = require('child_process'); // Import the child_process module for spawning child processes

// Import the c4sHelper module for Clips4Sale helper functions
const c4s = require(path.join(__dirname, 'c4sHelper.js'));

// Set up the WebdriverIO client configuration for browser automation
var webdriverio = require('webdriverio'); // Import the webdriverio module for browser automation
var config = {
  desiredCapabilities: {
    browserName: 'chrome',
    chromeOptions: {
      binary: path.join(__dirname, '../../../../bin/chromedriver.exe') // Path to the ChromeDriver binary
    },
  },
  singleton: true, // Enable persistent sessions
  debug: true, // Enable debugging
};
var client = webdriverio.remote(config); // Create a remote WebdriverIO client instance with the specified configuration

// Check if the WebDriverIO client file exists
try {
  if (fs.existsSync(path.join(__dirname, '../../../../webdriverio/client.js'))) {
    console.log('WebDriverIO Client Found!'); // Log a message if the client file is found
  }
} catch (err) {
  console.error(err) // Log any errors that occur during the file existence check
  console.log('WDIO client not found.'); // Log a message if the client file is not found
}

// Log the path to the ChromeDriver binary
console.log(path.join(__dirname, '../../../../bin/chromedriver.exe'));

// Define a GET route for the root path of the Clips4Sale API
clips4sale.get('/', (req, res) => {
  res.status(200).json({
    message: 'Clips4Sale API' // Respond with a JSON message indicating the API is accessible
  });
});

// Define a POST route for spawning a child process to handle clip posting
clips4sale.post('/spawn', jsonParser, (req, res) => {
  const event = req.body; // Extract the request body as an event object
  var child = cp.fork(path.join(__dirname, 'postClip.js'), [JSON.stringify(event)]); // Fork a child process to run the postClip.js script with the event data
  child.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`); // Log the exit code of the child process
  });
  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`); // Log any data received from the child process's stdout
  });
  child.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`); // Log any errors received from the child process's stderr
  });
});

// Define a GET route for listing clips, with a mock implementation
clips4sale.get('/clips', function(req, res) {
  if (!req.header('X-Cookie')) {
    res.status(401).send('Missing X-Cookie Header'); // Respond with an error if the X-Cookie header is missing
  } else {
    const id = req.params.id; // Extract the id parameter from the request
    console.log(`GET /clips - Mock Endpoint`); // Log a message indicating this is a mock endpoint
    res.json({}); // Respond with an empty JSON object
  }
});

// Define a POST route for posting clips, with authentication and cookie handling
clips4sale.post('/clips', jsonParser, function(req, res) {
  if (!req.headers.authorization || req.headers.authorization.split(' ')[0] !== 'Bearer' || !req.header('X-Cookie')) {
    res.status(401).send('Missing Authentication Method.'); // Respond with an error if the authentication method is missing
  } else {
    const event = req.body; // Extract the request body as an event object
    const user = req.headers.authorization.split(' ')[1].split(':')[0]; // Extract the username from the authorization header
    const pass = req.headers.authorization.split(' ')[1].split(':')[1]; // Extract the password from the authorization header
    const credentials = {
      user: user || event["credentials"][0]["c4s_username"] || process.env.C4S_USER, // Set the username from the header, event, or environment variable
      pass: pass || event["credentials"][0]["c4s_password"] || process.env.C4S_PASS, // Set the password from the header, event, or environment variable
      phpsessid: req.header('X-Cookie') || event["credentials"][0]["c4s_phpsessid"] // Set the PHPSESSID from the header or event
    };
    const params = {
      client: client, // Pass the WebdriverIO client instance
      cookie: cookie // Pass the pre-authenticated cookie (not defined in this code snippet)
    };
    c4s.login(credentials, params, function(err, data) { // Call the login function with the credentials and params
      c4s.postClip(event, params, function(err, data) { // Call the postClip function with the event and params
        console.log(data); // Log the data received from the postClip function
        res.json(data); // Respond with the received data as JSON
      });
    });
  }
});

// Define a GET route for retrieving a specific clip by ID, with authentication and cookie handling
clips4sale.get('/clips/:id', function(req, res) {
  if (!req.headers.authorization || req.headers.authorization.split(' ')[0] !== 'Bearer' || !req.header('X-Cookie')) {
    res.status(401).send('Missing Authentication Method.'); // Respond with an error if the authentication method is missing
  } else {
    const id = req.params.id; // Extract the clip ID from the request parameters
    console.log(`Requesting Clip ID: ${id}`); // Log a message with the requested clip ID
    const user = req.headers.authorization.split(' ')[1].split(':')[0]; // Extract the username from the authorization header
    const pass = req.headers.authorization.split(' ')[1].split(':')[1]; // Extract the password from the authorization header
    const credentials = {
      user: user || event["credentials"][0]["c4s_username"] || process.env.C4S_USER, // Set the username from the header, event, or environment variable
      pass: pass || event["credentials"][0]["c4s_password"] || process.env.C4S_PASS, // Set the password from the header, event, or environment variable
      phpsessid: req.header('X-Cookie') || process.env.C4S_PHPSESSID || event["credentials"][0]["c4s_phpsessid"] // Set the PHPSESSID from the header, environment variable, or event
    };
    const params = {
      client: client // Pass the WebdriverIO client instance
    };

    c4s.login(credentials, params, function(err, data) { // Call the login function with the credentials and params
      c4s.getClip(id, params, function(err, data) { // Call the getClip function with the clip ID and params
        if (err) {
          console.log(err); // Log any errors that occur
          res.send(401, err); // Respond with an error status and the error message
        } else {
          console.log(data); // Log the data received from the getClip function
          res.json(data); // Respond with the received data as JSON
        }
      });
    });
  }
});

// Define a PUT route for updating a specific clip by ID, with a mock implementation
clips4sale.put('/clips/:id', function(req, res) {
  if (!req.header('X-Cookie')) {
    res.status(401).send('Missing X-Cookie Header'); // Respond with an error if the X-Cookie header is missing
  } else {
    const id = req.params.id; // Extract the clip ID from the request parameters
    console.log(`PUT /clips/${id} - Mock Endpoint`); // Log a message indicating this is a mock endpoint
    res.json({}); // Respond with an empty JSON object
  }
});

// Define a DELETE route for removing a specific clip by ID, with a mock implementation
clips4sale.delete('/clips/:id', function(req, res) {
  if (!req.header('X-Cookie')) {
    res.status(401).send('Missing X-Cookie Header'); // Respond with an error if the X-Cookie header is missing
  } else {
    const id = req.params.id; // Extract the clip ID from the request parameters
    console.log(`DELETE /clips/${id} - Mock Endpoint`); // Log a message indicating this is a mock endpoint
    res.json({}); // Respond with an empty JSON object
  }
});

// Mount the sales router on the /sales path
clips4sale.use('/sales', sales);

// Mount the ftp router on the /ftp path
clips4sale.use('/ftp', ftp);

// Export the clips4sale router for use in other modules
module.exports = clips4sale;