// This script automates the process of uploading and configuring video content on the Clips4Sale admin platform using the WebdriverIO library.
const dateutil = require('dateutil'); // Requires the 'dateutil' module for date manipulation (though not used in the provided code)
const dateFormat = require('dateformat'); // Requires the 'dateformat' module for formatting dates
var fs = require('fs'); // Requires the 'fs' module to interact with the file system
var path = require('path'); // Requires the 'path' module to work with file and directory paths
var webdriverio = require('webdriverio'); // Requires the 'webdriverio' module to automate web browser interaction
const spawn = require('child_process').spawn; // Requires the 'spawn' method from 'child_process' module to spawn subprocesses (marked TODO to change to fork)

// Webdriver Client Instance
var config = { // Defines the configuration object for the WebdriverIO client
  desiredCapabilities: { // Specifies the desired capabilities for the browser session
    browserName: 'chrome', // Sets the browser name to Chrome
    chromeOptions: { // Chrome-specific options
      binary: path.join(__dirname, '../../../../bin/chromedriver.exe') // Sets the path to the ChromeDriver binary
    },
  },
  singleton: true, // Enable persistent sessions
  debug: true, // Enables debugging
  // host: "http://127.0.0.1", // Uncomment to set a custom host for WebDriver server
  // port: 4444 // Uncomment to set a custom port for WebDriver server
};
var client = webdriverio.remote(config); // Creates a remote WebdriverIO client with the specified configuration
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")) // Loads the configuration from a JSON file in the APPDATA directory
// let settings = fs.readFileSync(path.join(process.env.APPDATA, "clipnuke", "config.json")); // Alternative way to read the configuration file (commented out)
console.log(conf); // Logs the loaded configuration to the console

console.log(process.argv); // Logs the command-line arguments to the console
var event = JSON.parse(process.argv[2]); // Parses the second command-line argument as JSON to get the event object

// ETL
var tagCount = event.tags.length; // Counts the number of tags in the event object
// Remove . and / from titles per C4S
var name = event.name.replace('.', '').replace('/', ''); // Cleans the event name by removing dots and slashes
console.log(`Clean Title: ${name}`); // Logs the cleaned title to the console
var description = `${event.description}`; // Sets the description to the event's description
var d = { // Creates an object to hold formatted date parts
  mm: dateFormat(event.releaseDate, "mm"), // Formats the month part of the release date
  d: dateFormat(event.releaseDate, "d"), // Formats the day part of the release date
  yyyy: dateFormat(event.releaseDate, "yyyy"), // Formats the year part of the release date
  HH: dateFormat(event.releaseDate, "HH"), // Formats the hour part of the release date
  MM: dateFormat(event.releaseDate, "MM"), // Formats the minute part of the release date
};
var response = {}; // Initializes an empty object to hold responses
console.log(event); // Logs the event object to the console for debugging

// Set defaults if not set -- so this script doesn't throw exceptions
if (!event.filename) { // Checks if the filename is not set in the event object
  event.filename = ''; // Sets a default empty filename
} else { // If the filename is set
  event.filename = path.parse(event.filename).base; // Parses the filename and sets it to the base name (file name with extension)
}
if (!event.thumbnailFilename) { // Checks if the thumbnail filename is not set in the event object
  event.thumbnailFilename = -2; // Sets a default value for the thumbnail filename
} else { // If the thumbnail filename is set
  event.thumbnailFilename = path.parse(event.thumbnailFilename).base; // Parses the thumbnail filename and sets it to the base name
}
if (!event.trailerFilename) { // Checks if the trailer filename is not set in the event object
  event.trailerFilename = ''; // Sets a default empty trailer filename
} else { // If the trailer filename is set
  event.trailerFilename = path.parse(event.trailerFilename).base; // Parses the trailer filename and sets it to the base name
}

// The following code block initializes the WebdriverIO client, navigates to the Clips4Sale admin login page, logs in, sets a cookie, and then navigates to the clip upload page. It also sets various fields in the form based on the event data, handles errors, and finally logs the success or error messages.
client
  .init() // Initializes the browser session
  .url('https://admin.clips4sale.com/login/index') // Navigates to the Clips4Sale admin login page
  .waitForVisible('input#username', 3000) // Waits for the username input to be visible within 3000ms
  .setValue('input#username', conf.settings.clips4sale.user) // Sets the username input to the username from the configuration
  .setValue('input#password', conf.settings.clips4sale.pass).pause(200) // Sets the password input to the password from the configuration and pauses for 200ms
  // .submitForm('input.btn-primary') // Submits the login form (commented out)
  .click('input.btn.btn-primary') // Clicks the login button
  .setCookie({ // Sets a cookie
    domain: "admin.clips4sale.com", // Sets the cookie domain
    name: "PHPSESSID", // Sets the cookie name
    secure: false, // Sets the cookie to be insecure (not using HTTPS)
    value: conf.settings.clips4sale.phpsessid, // Sets the cookie value from the configuration
    // expiry: seconds+3600 // Sets the cookie expiry time (commented out)
  })
  .pause(1000) // Pauses for 1000ms
  .url('https://admin.clips4sale.com/clips/index') // Navigates to the clip upload page
  .execute(function() { // Executes custom JavaScript in the browser context (function body commented out)
    // window.addEventListener("beforeunload", function (e) {
    //   var confirmationMessage = "\o/";
    //
    //   (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    //   return confirmationMessage;                            //Webkit, Safari, Chrome
    // });
  })
  .waitForVisible('input[name="ClipTitle"]', 30000) // Waits for the clip title input to be visible within 30000ms
  // .setValue('[name="ClipTitle"]', event.name +  map.get(event.flavor)) // Sets the clip title input to the event name and flavor (commented out)
  .setValue('input[name="ClipTitle"]', name).pause(200) // Sets the clip title input to the cleaned name and pauses for 200ms
  .getAttribute('input[name="producer_id"]', 'value').then(function(val) { // Gets the value of the producer_id input
    // console.log('category is: ' + JSON.stringify(val)); // Logs the category (commented out)
    event.producer_id = val * 1; // Sets the event's producer_id to the retrieved value, converting it to a number
    console.log(event.producer_id); // Logs the producer_id to the console
  })
  /** PRODUCER ID */
  .execute(function(data) { // Executes custom JavaScript in the browser context to retrieve the producer_id
    var data = {}; // Initializes an empty object to store data
    data.producer_id = $('input[name="producer_id"]')[0].value * 1; // Retrieves the producer_id from the input and converts it to a number
    console.log(data); // Logs the data object to the console
    return data; // Returns the data object
  }).then(function(data) { // Handles the returned data from the previous execute call
    event.producer_id = data.producer_id; // Sets the event's producer_id to the retrieved value
    console.log(data.producer_id); // Logs the producer_id to the console
    // event.clip_id = data.clip_id; // Sets the event's clip_id to the retrieved value (commented out)
  })
  .execute(function(description) { // Executes custom JavaScript in the browser context to set the description in the TinyMCE editor
    console.log(description); // Logs the description to the console
    var cleanDesc = description.replace(/kid|xxxmultimedia.com|xxxmultimedia|hooker|teenager|force|forced|forcing|teenie/g, ''); // Cleans the description by removing certain words
    // browser context - you may not access client or console
    tinyMCE.activeEditor.setContent(`${cleanDesc}`, { // Sets the content of the TinyMCE editor to the cleaned description
      format: "raw" // Specifies the format as raw
    });
  }, description) // Passes the description to the execute function
  .selectByVisibleText('select#keycat', event.category).catch(function(err) { // Selects the main category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 1 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms
  .selectByVisibleText('select#key1', event.relatedCategories[0] || 'Select Related Categories').catch(function(err) { // Selects the first related category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 2 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms
  .selectByVisibleText('select#key2', event.relatedCategories[1] || 'Select Related Categories').catch(function(err) { // Selects the second related category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 3 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms
  .selectByVisibleText('select#key3', event.relatedCategories[2] || 'Select Related Categories').catch(function(err) { // Selects the third related category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 4 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms
  .selectByVisibleText('select#key4', event.relatedCategories[3] || 'Select Related Categories').catch(function(err) { // Selects the fourth related category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 5 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms
  .selectByVisibleText('select#key5', event.relatedCategories[4] || 'Select Related Categories').catch(function(err) { // Selects the fifth related category by visible text and handles errors
    response.err = err; // Sets the error in the response object
    response.msg = 'Error: Category 6 Not Found.'; // Sets the error message in the response object
    // client.end(); /** Ends browser session {@link editVid| read editVids docs} */ (commented out)
    console.log(response); // Logs the response object to the console
    client.end(); // Ends the browser session
    // return callback(err, response); // Returns the error and response to a callback (commented out)
  }).pause(200) // Pauses for 200ms

  /* TRAILERS */
  .execute(function(event) { // Executes custom JavaScript in the browser context to set the trailer file
    console.log("Selecting the trailer file.", event.trailerFilename.replace(/^.*[\\\/]/, '')); // Logs the action of selecting the trailer file
    $('#clip_preview').val(event.trailerFilename); // Sets the value of the clip_preview input to the trailer filename
    $('#clip_preview').trigger('change'); // Triggers the change event on the clip_preview input
  }, event) // Passes the event object to the execute function

  /* VIDEO FILE */
  .execute(function(event) { // Executes custom JavaScript in the browser context to set the thumbnail file
    $('#ClipImage').val(event.thumbnailFilename); // Sets the value of the ClipImage input to the thumbnail filename
    $('#ClipImage').trigger('change'); // Triggers the change event on the ClipImage input
  }, event) // Passes the event object to the execute function

  /* VIDEO FILE */
  .execute(function(event) { // Executes custom JavaScript in the browser context to set the video file
    $('#ClipName').val(event.filename.replace(/^.*[\\\/]/, '') || ""); // Sets the value of the ClipName input to the video filename
    $('#ClipName').trigger('change'); // Triggers the change event on the ClipName input
  }, event).pause(1000) // Passes the event object to the execute function and pauses for 1000ms

  /** TAGS */
  // Remove teenie
  .setValue('input[name="keytype[0]"]', event.tags[0] || '').pause(200) // Sets the first tag input to the first tag from the event or an empty string and pauses for 200ms
  .setValue('input[name="keytype[1]"]', event.tags[1] || '').pause(200) // Sets the second tag input to the second tag from the event or an empty string and pauses for 200ms
  .setValue('input[name="keytype[2]"]', event.tags[2] || '') // Sets the third tag input to the third tag from the event or an empty string
  .setValue('input[name="keytype[3]"]', event.tags[3] || '') // Sets the fourth tag input to the fourth tag from the event or an empty string
  .setValue('input[name="keytype[4]"]', event.tags[4] || '') // Sets the fifth tag input to the fifth tag from the event or an empty string
  .setValue('input[name="keytype[5]"]', event.tags[5] || '') // Sets the sixth tag input to the sixth tag from the event or an empty string
  .setValue('input[name="keytype[6]"]', event.tags[6] || '') // Sets the seventh tag input to the seventh tag from the event or an empty string
  .setValue('input[name="keytype[7]"]', event.tags[7] || '') // Sets the eighth tag input to the eighth tag from the event or an empty string
  .setValue('input[name="keytype[8]"]', event.tags[8] || '') // Sets the ninth tag input to the ninth tag from the event or an empty string
  .setValue('input[name="keytype[9]"]', event.tags[9] || '') // Sets the tenth tag input to the tenth tag from the event or an empty string
  .setValue('input[name="keytype[10]"]', event.tags[10] || '') // Sets the eleventh tag input to the eleventh tag from the event or an empty string
  .setValue('input[name="keytype[11]"]', event.tags[11] || '') // Sets the twelfth tag input to the twelfth tag from the event or an empty string
  .setValue('input[name="keytype[12]"]', event.tags[12] || '') // Sets the thirteenth tag input to the thirteenth tag from the event or an empty string
  .setValue('input[name="keytype[13]"]', event.tags[13] || '') // Sets the fourteenth tag input to the fourteenth tag from the event or an empty string
  .setValue('input[name="keytype[14]"]', event.tags[14] || '') // Sets the fifteenth tag input to the fifteenth tag from the event or an empty string
  .setValue('input[name="DisplayOrder"]', event.displayOrder || 0) // Sets the display order input to the display order from the event or 0
  .selectByValue("#fut_month", d.mm || dateFormat(getDate(), "mm")).pause(100) // Selects the future month by value and pauses for 100ms
  .selectByValue("#fut_day", d.d || dateFormat(getDate(), "dd")).pause(100) // Selects the future day by value and pauses for 100ms
  .selectByValue("#fut_year", d.yyyy || dateFormat(getDate(), "yyyy")).pause(100) // Selects the future year by value and pauses for 100ms
  .selectByValue("#fut_hour", d.HH || dateFormat(getDate(), "HH")).pause(100) // Selects the future hour