// This script configures environment variables, initializes a webdriverio client, and uses the ManyVids module to log in and edit a video by its ID.

require('dotenv').config({ // Load environment variables from a specific .env file
  path: '.env.manyvids' // Specify the path to the .env file
});
const mv = require('./manyvids.js'); // Import the ManyVids module
const webdriverio = require('webdriverio'); // Import the webdriverio module for browser automation
const options = { // Define options for the webdriverio client
  desiredCapabilities: { // Set desired capabilities for the browser
    browserName: 'chrome' // Specify the browser to use (Chrome in this case)
  },
  host: process.env.HOST || "http://localhost", // Set the host for the webdriver server, default to localhost
  port: process.env.PORT || 4444 // Set the port for the webdriver server, default to 4444
};
var client = webdriverio.remote(options); // Initialize a remote webdriverio client with the specified options

// A pre-authenticated test cookie
var cookie = {"domain":".manyvids.com","expiry":1520927551.376236,"httpOnly":true,"name":"PHPSESSID","path":"/","secure":false,"value":"rb1kb7j0t2k1pbja6agg8trkd1"}; // Define a cookie object with authentication details

const params = { // Create an object to hold parameters for the ManyVids functions
  client: client, // Include the webdriverio client
  cookie: cookie // Include the pre-authenticated cookie
};

// Login to ManyVids and get our session cookie
mv.login(params, function(err, cookie) { // Call the login function from the ManyVids module with the parameters and a callback function
  console.log(process.argv[2]); // Log the third command line argument to the console
  var id = process.argv[2]; // Store the third command line argument as the video ID

  mv.editVid(id, params, function(err, data) { // Call the editVid function from the ManyVids module with the video ID, parameters, and a callback function

    console.log(data); // Log the data returned from the editVid function to the console
  });

});