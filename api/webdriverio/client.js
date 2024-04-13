// This file initializes a WebDriverIO client using a configuration file and exports it for use in other modules.

const webdriverio = require('webdriverio'); // Require the webdriverio module to control the browser
const path = require('path'); // Require the path module to work with file and directory paths

// Initialize a new WebDriverIO Client using configuration from a separate file
const config = require(path.join(__dirname, 'config.js')).config; // Load the configuration from config.js located in the same directory as this file
var client = webdriverio.remote(config); // Create a remote WebDriverIO client with the loaded configuration

module.exports = {
  client // Export the initialized client for use in other modules
};