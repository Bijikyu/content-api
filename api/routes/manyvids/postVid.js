// This file/module is a script for automating web interactions using WebDriverIO with Node.js.
// It includes code to initialize a WebDriverIO client, log into the ManyVids website, and perform actions related to video uploads.

const fs = require('fs'); // Require the file system module for file operations
const path = require('path'); // Require the path module for handling file paths
const webdriverio = require('webdriverio'); // Require the webdriverio module for browser automation

// Webdriver Client Instance
var config = {
  desiredCapabilities: {
    browserName: 'chrome', // Set the browser to be used as Chrome
    chromeOptions: {
      binary: path.join(__dirname, '../../../../bin/chromedriver.exe') // Set the path to the ChromeDriver binary
    },
  },
  singleton: true, // Enable persistent sessions
  debug: true, // Enable debugging
  // host: "http://127.0.0.1", // Uncomment to set a custom host for WebDriver
  // port: 4444 // Uncomment to set a custom port for WebDriver
};
var client = webdriverio.remote(config); // Create a remote WebDriverIO client with the specified configuration
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")) // Load configuration from a JSON file
var event = JSON.parse(process.argv[2]); // Parse the second command line argument as JSON into the event variable
var uploadCount = 0; // Initialize the upload count to 0

client
  .init().catch(function(err, params) { // Initialize the WebDriverIO client and catch any errors
    client.end(); // Ends browser session {@link editVid| read editVids docs}
    console.log('WDIO.init() failed.'); // Log that the WebDriverIO initialization failed
    return callback(`WDIO.init() failed.`, {}); // Return a callback indicating failure
  })
  // .setCookie(cookie) // Uncomment to set a cookie
  .url('https://www.manyvids.com/Login/') // Navigate to the ManyVids login page
  // .waitForVisible('button.js-warning18-popup', 3000) // Uncomment to wait for a specific element to become visible
  // .click('button.js-warning18-popup') // Uncomment to click on a specific element
  .setValue('#triggerUsername', conf.settings.manyvids.user) // Set the username field to the user from the configuration
  .setValue('#triggerPassword', conf.settings.manyvids.pass) // Set the password field to the password from the configuration
  .waitForVisible('body > div.mv-profile', 30000) // Wait for a specific element to become visible indicating a successful login
  // .click('#loginAccountSubmit') // Uncomment to click the login button

  // Upload the file.
  .url(`https://www.manyvids.com/Upload-vids/`) // Navigate to the ManyVids upload page
  .waitForVisible('#pickfiles', 30000) // Wait for the file picker to become visible
  .execute(function(uploadCount) { // Execute custom JavaScript code within the browser context
    uploadCount = $("div.action-link > a").length; // Set the uploadCount to the number of elements matching the selector
  }, uploadCount)
  .click('#pickfiles') // Click on the file picker element
  // .chooseFile(`input[type="file"][0]`,localPath) // Uncomment to choose a file for upload

  // Wait for the Edit Page, then prefill
  .waitForVisible("li.js-upload-row > div > div > div > h5", 180000) // Wait for a specific element to become visible indicating the upload page is ready
  // .execute(function(description) { // Uncomment to execute custom JavaScript code within the browser context
  //   "https://manyvids.com/" + $("div.action-link > a").attr("href"); // Construct and return the URL of the uploaded video
  // })
  .waitUntil(() => { // Wait until a certain condition is met
    console.log("i.processing-upload-icon"); // Log a message to the console
    return $("i.processing-upload-icon").length === 0 // Return true when there are no elements matching the selector, indicating processing is complete
  }, 5000, 'expected text to be different after 5s')
  .execute(function() { // Execute custom JavaScript code within the browser context
    UploadComplete // This line seems to be missing an action or variable assignment
  })
  // .waitForVisible("body > div.mv-controls > div.video-player-edit-page", 1800000) // Uncomment to wait for a specific element to become visible
  .setValue('[name="video_title"]', event.name) // Set the video title field to the name from the event object
  .setValue('[name="video_description"]', event.description) // Set the video description field to the description from the event object
  // .pause(2000) // Uncomment to pause the execution for a specified amount of time
  // .chooseFile("#container > div > input", file) // Uncomment to choose a file for upload
  .getValue("#container > div > input").then(function(val) { // Get the value of a specific input field and then execute a function
    console.log('File to Upload: ' + JSON.stringify(val)); // Log the file to be uploaded
  });