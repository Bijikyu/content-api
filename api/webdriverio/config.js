// This file/module is a configuration for WebDriverIO, setting up options for running tests with Chrome browser.

const path = require('path'); // Require the path module from Node.js to handle file paths

// WebDriverIO Configuration
let debug = process.env.DEBUG; // Assign the value of the DEBUG environment variable to the debug variable
const config = { // Define the configuration object for WebDriverIO
  capabilities: [{ // Define the capabilities for the WebDriverIO session
    browserName: 'chrome' // Set the browser name to Chrome
  }],
  desiredCapabilities: { // Define the desired capabilities for the WebDriverIO session
    browserName: 'chrome', // Set the desired browser name to Chrome
    // seleniumAddress: 'http://localhost:4444/wd/hub', // Uncomment to set the address of the Selenium server
    // 'w3c': false, // Uncomment to disable W3C protocol
    chromeOptions: { // Set Chrome-specific options
      binary: path.join(__dirname, '../bin/chromedriver.exe'), // Set the path to the ChromeDriver binary
      // binary: 'electron ' + __dirname, // Uncomment to set the path to the Electron binary
      // 'w3c': false, // Uncomment to disable W3C protocol for Chrome options
      args: [ // Define arguments to pass to Chrome
        'user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53', // Set the user-agent to mimic an iPhone
        'headless', // Run Chrome in headless mode without a GUI
        'disable-gpu', // Disable GPU hardware acceleration
        'no-sandbox', // Disable the sandbox security feature
        'disable-dev-shm-usage', // Prevent Chrome from using /dev/shm
        'allow-insecure-localhost', // Allow insecure connections to localhost
      ],
    }
  },
  singleton: true, // Enable persistent sessions
  debug: true, // Enable debugging
  // host: "http://localhost", // Uncomment to set the host for the WebDriverIO server
  // port: 4444 // Uncomment to set the port for the WebDriverIO server
};

module.exports = { // Export the configuration object
  config // Export the config object as a property
};