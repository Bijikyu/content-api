// This script sets up a WebDriverIO client to automate interactions with a web page, specifically for logging in and editing a video on ManyVids.com.
// It reads configuration from a JSON file and uses environment variables and command line arguments.

const fs = require('fs'); // Require the file system module
const path = require('path'); // Require the path module
const webdriverio = require('webdriverio'); // Require the webdriverio module for browser automation

// Webdriver Client Instance
var config = {
  desiredCapabilities: {
    browserName: 'chrome', // Desired capability for the browser to use, in this case, Chrome
    chromeOptions: {
      binary: path.join(__dirname, '../../../../bin/chromedriver.exe') // Path to the ChromeDriver binary
    },
  },
  singleton: true, // Enable persistent sessions
  debug: true // Enable debugging
};
var client = webdriverio.remote(config); // Create a remote WebDriverIO client with the specified config
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")) // Load configuration from a JSON file
var event = JSON.parse(process.argv[2]); // Parse the second command line argument as JSON to get the event object

client
  .init() // Initialize the WebDriverIO client
  .url('https://www.manyvids.com/Login/') // Navigate to the ManyVids login page
  .setValue('#triggerUsername', conf.settings.manyvids.user) // Set the username field to the user from the config
  .setValue('#triggerPassword', conf.settings.manyvids.pass) // Set the password field to the password from the config
  .waitForVisible('body > div.mv-profile', 30000) // Wait for the profile div to be visible, with a timeout of 30 seconds
  .pause(2000) // Pause for 2 seconds
  .url(`https://www.manyvids.com/Edit-vid/${event.manyvids_id}/`) // Navigate to the video edit page using the manyvids_id from the event object
  .waitForVisible('input#Title', 60000) // Wait for the title input to be visible, with a timeout of 60 seconds
  .execute(function(event) { // Execute custom JavaScript in the browser context
    $(document).ready(function() { // Wait for the document to be ready
      // Title
      $('[name="video_title"]').val(event.name); // Set the video title to the name from the event object
      // Description
      $('[name="video_description"]').val(event.description.replace(/(<([^>]+)>)/ig, "")); // Strip HTML tags from the description and set it

      // Teaser
      // Thumbnail

      // Categories
      if ($('ul.multi-dropdown-list').length) { // Check if the categories dropdown list exists
        $('ul.multi-dropdown-list').html(''); // Clear the categories list
      }
      event.categories.forEach(function(value, index){ // Iterate over each category in the event object
        $('ul.multi-dropdown-list').append(`<li><a href="javascript:;" class="remove-tag" title="Remove tag">x</a>CAT # ${value}<input name="tags[]" type="hidden" value="${event.manyvids.categories[index]}"></li>`); // Append each category to the list
      });

      // "Set Your Price" - Default
      // TODO: Set price by video length
      $("#free_vid_0").click(); // Click on the "Set Your Price" radio button
      $('[name="video_cost"]').val(event.price || 9.99); // Set the video cost to the price from the event object or default to 9.99

      // "MV Tube"
      if (event.tube) { // Check if the event object specifies the video is for MV Tube
        $("#free_vid_1").click(); // Click on the "MV Tube" radio button
        $("#appendedPrependedDownloadCost").val(event.price || 4.99); // Set the download price for MV Tube
      }

      // "Make This Vid Free"
      if (event.free) { // Check if the event object specifies the video should be free
        $("#free_vid_2").click(); // Click on the "Make This Vid Free" radio button
      }

      // Intensity
      $('#intensity').val(event.intensity || 0); // Set the intensity to the value from the event object or default to 0
      $('#intensity').niceSelect('update'); // Update the niceSelect plugin for the intensity dropdown

      // Discount
      $("#sale").val(event.discountPercentage || ""); // Set the discount percentage to the value from the event object or leave it empty
      $("#sale").niceSelect('update'); // Update the niceSelect plugin for the discount dropdown

      // Exclusive?
      $("#exclusiveVid").prop("checked", event.exclusive || false); // Set the exclusive checkbox based on the event object

      // Model Attributes
      $("#age_basic").val(event.age || false); // Set the age to the value from the event object or leave it false
      $("#age_basic").niceSelect('update'); // Update the niceSelect plugin for the age dropdown
      $("#ethnicity_basic").val(event.ethnicity || false); // Set the ethnicity to the value from the event object or leave it false
      $("#ethnicity_basic").niceSelect('update'); // Update the niceSelect plugin for the ethnicity dropdown
      $("#breast_size_basic").val(event.breastSize || false); // Set the breast size to the value from the event object or leave it false
      $("#breast_size_basic").niceSelect('update'); // Update the niceSelect plugin for the breast size dropdown

      // Custom Vid Order?
      $("#show_customvid_table").prop("checked", event.custom || false); // Set the custom video order checkbox based on the event object

      // Security Options
      $("#stream_only").val(event.streamOnly || 1); // Set the stream only option to the value from the event object or default to 1
      $("#stream_only").niceSelect("update"); // Update the niceSelect plugin for the stream only dropdown

      // Block Teaser
      $("#block_preview").prop("checked", event.blockPreview || false); // Set the block teaser checkbox based on the event object

      // Content Rating
      if (event.sfw === true || event.nsfw === false) { // Check if the video is safe for work or not safe for work based on the event object
        $("#safe_for_work").val(1199); // Set the content rating to SFW
      } else {
        $("#safe_for_work").val(); // Leave the content rating as NSFW (default)
      }
      $("#safe_for_work").niceSelect('update'); // Update the niceSelect plugin for the content rating dropdown
    });
  }, event) // Pass the event object to the execute function

  .catch((e) => { // Catch any errors during the WebDriverIO client operations
    client.end(); // End the WebDriverIO client session
    console.log(e); // Log the error to the console
    // return callback(e); // Return the error to a callback function if it exists
  });