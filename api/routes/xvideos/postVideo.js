// This script is designed to automate the process of video uploads to the XVideos platform using the WebdriverIO library.
// It reads configuration and event data, sets up the WebDriver client, logs into the XVideos account,
// fills out the upload form with video details, and submits the video for upload.

const dateutil = require('dateutil'); // Requires the 'dateutil' module for date manipulation
const dateFormat = require('dateformat'); // Requires the 'dateFormat' module for formatting dates
const fs = require('fs'); // Requires the 'fs' module to interact with the file system
const path = require('path'); // Requires the 'path' module to work with file and directory paths
var webdriverio = require('webdriverio'); // Requires the 'webdriverio' module to control a web browser
var HashMap = require('hashmap'); // Requires the 'hashmap' module to create hash maps

// Webdriver Client Instance
var config = {
  desiredCapabilities: {
    browserName: 'chrome', // Sets the browser to be used as Chrome
    chromeOptions: {
      binary: path.join(__dirname, '../../../../bin/chromedriver.exe') // Sets the path to the ChromeDriver binary
    },
  },
  singleton: true, // Enable persistent sessions
  debug: true, // Enables debugging mode
  // host: "http://127.0.0.1", // Uncomment to set a custom WebDriver host
  // port: 4444 // Uncomment to set a custom WebDriver port
};
var client = webdriverio.remote(config); // Creates a remote WebDriver client with the specified configuration
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // Loads the configuration file from the specified path

console.log(process.argv); // Logs the command line arguments to the console
var event = JSON.parse(process.argv[2]); // Parses the second command line argument as JSON to get the event data

// Ass. Array -
var video_premium = new HashMap(); // Creates a new HashMap for video premium options
video_premium
  .set("Free for All", "upload_form_video_premium_video_premium_centered_zone_all_site") // Maps "Free for All" to its corresponding form ID
  .set("Paying Users", "upload_form_video_premium_video_premium_centered_zone_premium"); // Maps "Paying Users" to its corresponding form ID

var networksites = new HashMap(); // Creates a new HashMap for network sites options
networksites
  .set("Xvideos Only", "upload_form_networksites_networksites_centered_networksites_DEFAULT_ONLY") // Maps "Xvideos Only" to its corresponding form ID
  .set("Xvideos & Network", "upload_form_networksites_networksites_centered_networksites_NO_RESTRICTION"); // Maps "Xvideos & Network" to its corresponding form ID

var category = new HashMap(); // Creates a new HashMap for category options
category
  .set("Straight", "upload_form_category_category_centered_category_straight") // Maps "Straight" to its corresponding form ID
  .set("Gay", "upload_form_category_category_centered_category_gay") // Maps "Gay" to its corresponding form ID
  .set("Shemale", "upload_form_category_category_centered_category_shemale"); // Maps "Shemale" to its corresponding form ID

// Code block for downloading the video file and setting up a local HTTP server is commented out

// Remove . and / from titles per C4S
var name = event.name.replace('.', '').replace('/', ''); // Removes '.' and '/' from the event name and assigns it to 'name'
console.log(`Clean Title: ${name}`); // Logs the cleaned title to the console
var description = `${event.description}`; // Assigns the event description to 'description'

console.log(event); // Logs the event data to the console for debugging

if (event["video_premium"] == "upload_form_video_premium_video_premium_centered_zone_premium") {
  params.client.click('#' + event["networksites"]); // Clicks on the network sites option based on the event data
}

// Code block for handling translations is commented out

client.init() // Initializes the WebDriver client
  .url('https://www.xvideos.com/account') // Navigates to the XVideos account URL
  .pause(1000) // Pauses for 1 second
  // .waitForVisible('form', 3000) // Waits for the form to be visible, commented out
  .setValue('body #signin-form_login', conf.settings.xvideos.user) // Sets the username in the login form
  .setValue('body #signin-form_password', conf.settings.xvideos.pass) // Sets the password in the login form
  // .submitForm('body #signin-form') // Submits the login form, commented out
  .click('#signin-form > div.form-group.form-buttons > div > button') // Clicks the login button
  .pause(1000) // Pauses for 1 second
  // .init() // Initializes the WebDriver client, commented out
  /* .setCookie(params.cookie) */ // Sets a cookie, commented out
  .url('https://www.xvideos.com/account/uploads/new') // Navigates to the new upload URL
  .pause(1000) // Pauses for 1 second
  .click('input#' + event["video_premium"]) // Clicks on the video premium option based on the event data
  .click('input#' + event["category"]) // Clicks on the category option based on the event data
  .click('input#' + event["networksites"]) // Clicks on the network sites option based on the event data

  // Title & Description
  .setValue('textarea#upload_form_titledesc_description', event.description.substring(0, 500).replace(/<[^>]*>?/gm, '')) // Sets the video description, stripping HTML and limiting to 500 characters
  .setValue('input#upload_form_titledesc_title', event.name) // Sets the video title
  .setValue('input#upload_form_titledesc_title_network', event.networkName).pause(100) // Sets the network title and pauses for 0.1 seconds

  // Code block for selecting file via HTTP(S) is commented out

  // Ads to display
  // .click('#upload_form_sponsorlinks_sponsorlinks_'+event.sponsoredLinks[0]).pause(100) // Clicks on the sponsored links option based on the event data, commented out
  .click('input#upload_form_sponsorlinks_sponsorlinks_19609').pause(100) // Clicks on a specific sponsored link and pauses for 0.1 seconds

  // Agree to terms
  .click('#upload_form_file > div.form-group.form-field-upload_form_file_terms > div > div > label > div.checkbox-error-box').pause(1000) // Clicks on the terms agreement checkbox and pauses for 1 second
  // Add tags
  // Code block for adding tags is repeated for each tag, setting the value and clicking the add button

  .execute(function(event) { // Executes custom JavaScript within the browser context
    // Code block for setting translations based on event data
    return;
  }, event)
  .pause(1000) // Pauses for 1 second

  // Code block for submitting the form is commented out

  // Waits for the upload to be successful and logs the result
  .waitForVisible('#upload-form-progress > h5.status.text-success', 999999999).pause(10000) // Waits for the success message to be visible
  .execute(function(event) { // Executes custom JavaScript within the browser context
    // Code block for getting the URL of the uploaded video
  }, event)
  .then(function() { // Success callback
    params.client.end(); // Ends the WebDriver session
  })
  /** Success Callback */
  // Code block for waiting until a condition is met is commented out
  .next(function() { // Next callback
    console.log('Done!'); // Logs 'Done!' to the console
    console.log(JSON.stringify(event, null, 2)); // Logs the event data as a formatted JSON string
    // params.client.end(); // Ends the WebDriver session, commented out
    return callback(null, event); // Calls the callback function with no error and the event data
  })

  // Global Error Callback
  .catch((e) => { // Error callback
    params.client.end(); // Ends the WebDriver session
    console.log(e); // Logs the error to the console
    return callback(null, event); // Calls the callback function with no error and the event data
  });