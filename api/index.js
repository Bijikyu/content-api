// This script configures environment variables, initializes a WebDriverIO client, and uses a ManyVids module to log in and edit a video.

require('dotenv').config({ // Load environment variables from a specific file
  path: '.env.manyvids' // Specify the path to the environment variables file
});
const mv = require('./manyvids.js'); // Import the ManyVids module
const webdriverio = require('webdriverio'); // Import the WebDriverIO library
const options = { // Define options for the WebDriverIO client
  desiredCapabilities: { // Set desired capabilities for the browser
    browserName: 'chrome' // Specify the browser name to use
  },
  host: process.env.HOST || "http://localhost", // Set the WebDriver host, default to localhost if not specified
  port: process.env.PORT || 4444 // Set the WebDriver port, default to 4444 if not specified
};
var client = webdriverio.remote(options); // Initialize a remote WebDriverIO client with the specified options

// Define a pre-authenticated test cookie
var cookie = {"domain":".manyvids.com","expiry":1520927551.376236,"httpOnly":true,"name":"PHPSESSID","path":"/","secure":false,"value":"rb1kb7j0t2k1pbja6agg8trkd1"}; // Create a cookie object with session details

const params = { // Define parameters to pass to the ManyVids functions
  client: client, // Include the WebDriverIO client
  cookie: cookie // Include the pre-authenticated cookie
};

// Use the ManyVids module to log in and obtain a session cookie, then edit a video
mv.login(params, function(err, cookie) { // Call the login function from the ManyVids module with the parameters and a callback
  console.log(process.argv[2]); // Log the third command-line argument to the console
  var id = process.argv[2]; // Store the third command-line argument as the video ID

  mv.editVid(id, params, function(err, data) { // Call the editVid function from the ManyVids module with the video ID, parameters, and a callback
    console.log(data); // Log the data returned from the editVid function to the console
  });

});