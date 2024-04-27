// This file/module is a script for interacting with the ManyVids website using the WebDriverIO automation library.
// It includes functions for authenticating a user, retrieving video details, uploading a video, and posting video details.

const webdriverio = require('webdriverio'); // Require the webdriverio module for browser automation
const path = require('path'); // Require the path module for handling file paths

// Initialized a new WebDriverIO Client.
const config = require(path.join(__dirname, '..', '..', 'webdriverio/config.js')).config; // Load the WebDriverIO configuration from a file
var client = webdriverio.remote(config); // Create a remote WebDriverIO client using the loaded configuration

// Login to ManyVids.
// Init a new webdriverio session.
// @param  {webdriverio}   client   A webdriverio client
// @param  {Function}      callback err, data
// @return {Object}                 A webdriverio cookie containing the authenticated PHPSESSID
function auth(credentials, params, callback) { // Define the auth function to authenticate a user
  params.client
    .init().catch(function(err, params) { // Initialize a new WebDriverIO client session
      params.client.end(); // Ends browser session if init fails
      console.log('WDIO.init() failed.'); // Log a message if the initialization fails
      return callback(`WDIO.init() failed.`, {}); // Return an error through the callback
    }, params)
    // .setCookie(params.cookie)
    .url('https://www.manyvids.com/Login/') // Navigate to the ManyVids login page
    // .waitForVisible('button.js-warning18-popup', 3000) // No longer pops up on manyvids login page
    // .click('button.js-warning18-popup')
    .setValue('#triggerUsername', credentials.user) // Set the username field to the provided username
    .setValue('#triggerPassword', credentials.pass) // Set the password field to the provided password
    .waitForVisible('body > div.mv-profile', 30000) // Wait for the profile element to be visible, indicating a successful login
    // .click('#loginAccountSubmit')
    // .pause(15000) // Wait in case we need to solve a recaptcha.
    .next(function(data) { // Proceed to the next step in the chain
      console.log(data); // Log the data from the previous step
      return callback(null, data); // Return the data through the callback
    }).catch((e) => console.log(e)); // Catch any errors and log them
};

// Edit Vid - Details
// Sends a GET request to the server, using an authenticated webdriverio session, fetches the data, then ends the session.
// NOTE: It's super important to use .end() method to end the browser session. Because {@link auth | auth} calls init() to open a new browser session.
// IMPORTANT: If we don't run browser.end(), this app will fail when {@link getVid | getVid} or another method is called!
// @param  {Integer}   id      A ManyVids Video ID
// @param  {Object}   params   client, cookie
// @param  {Function} callback [description]
// @return {Object}            An object containing details about a ManyVids video.
function getVid(id, params, callback) { // Define the getVid function to retrieve video details
  var data = {}; // Initialize an empty data object
  data.video = {}; // Initialize an empty video object within data
  data.website = "MANYVIDS"; // Set the website property to "MANYVIDS"
  data.categories = []; // Initialize an empty categories array within data
  console.log(id, params); // Log the video ID and parameters

  params.client
    .setCookie(params.cookie) // Set the cookie for the session
    .url(`https://www.manyvids.com/Edit-vid/${id}/`) // Navigate to the video edit page for the specified video ID
    .pause(2000) // Pause for 2 seconds

    // Manyvids Session Details
    .getAttribute('html', 'data-session-details').then(function(val) { // Retrieve the session details attribute from the html element
      console.log('Session Details: ' + JSON.stringify(val)); // Log the session details
      data.session = JSON.parse(val); // Parse the session details and assign to data.session
      data.remoteStudioId = data.session.user_id; // Set the remoteStudioId property to the user_id from session details
    })

    // ManyVids Video ID
    .getAttribute('body', 'data-video-id').then(function(val) { // Retrieve the video ID attribute from the body element
      console.log('Video ID: ' + JSON.stringify(val)); // Log the video ID
      data.video.id = val; // Set the video.id property to the retrieved video ID
      data.remoteId = data.video.id; // Set the remoteId property to the video ID
    })

    /** Local Error Callback
     * @todo Break on various errors
     * @return error message, {}
     */
    .catch(function(err) { // Catch any errors during the retrieval of video details
      params.client.end(); // Ends the browser session if an error occurs
      console.log('Local catch called'); // Log that the local catch was called
      return callback(`Video ID not found for user ${data.session.username}. Error fetching the vid details.`, {}); // Return an error through the callback
    })

    // AWS eTag
    .getAttribute('body', 'data-etag').then(function(val) { // Retrieve the eTag attribute from the body element
      console.log('eTag: ' + JSON.stringify(val)); // Log the eTag
      data.video.etag = val; // Set the video.etag property to the retrieved eTag
    })

    // Trailer Filename
    .getAttribute('body', 'data-filename').then(function(val) { // Retrieve the filename attribute from the body element
      console.log('Filename: ' + JSON.stringify(val)); // Log the filename
      data.video.filename = val; // Set the video.filename property to the retrieved filename
    })

    // Price
    .getValue('[name="video_cost"]').then(function(val) { // Retrieve the value of the video_cost input field
      console.log('Price is: ' + JSON.stringify(val * 1)); // Log the price
      data.price = val * 1; // Set the price property to the retrieved value, converting it to a number
    }).catch(function(err) { // Catch any errors during the retrieval of the price
      params.client.end(); // Ends the browser session if an error occurs
      console.log('Local catch called'); // Log that the local catch was called
      return callback(`Video Cost not found for vid ID: ${id}. Error fetching the vid details.`, {}); // Return an error through the callback
    })

    // Video Title
    .getValue('[name="video_title"]').then(function(val) { // Retrieve the value of the video_title input field
      console.log('Title is: ' + JSON.stringify(val)); // Log the title
      data.name = val; // Set the name property to the retrieved title
    })

    // Description
    .getText('[name="video_description"]').then(function(val) { // Retrieve the text of the video_description input field
      console.log('Title is: ' + JSON.stringify(val)); // Log the description
      data.description = val; // Set the description property to the retrieved text
    })

    // Categories/"Tags"
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[1]/input', 'value').then(function(val) { // Retrieve the value of the first category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[2]/input', 'value').then(function(val) { // Retrieve the value of the second category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[3]/input', 'value').then(function(val) { // Retrieve the value of the third category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[4]/input', 'value').then(function(val) { // Retrieve the value of the fourth category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[5]/input', 'value').then(function(val) { // Retrieve the value of the fifth category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })

    // Video Length
    .getAttribute('.js-video-length', 'data-video-length').then(function(val) { // Retrieve the video length attribute from the js-video-length element
      console.log(val); // Log the video length
      if (val * 1) { // If the value can be converted to a number
        data.lengthSeconds = val * 1; // Set the lengthSeconds property to the numeric value
      } else { // If the value cannot be converted to a number
        data.length = val; // Set the length property to the raw value
      }
    })

    // Intensity
    .execute(function(obj) { // Execute a script to retrieve the selected intensity option value
      obj = jQuery('#intensity > option:selected')[0].value; // Use jQuery to select the intensity option and get its value
      return obj; // Return the value
    }, data).then(function(obj) { // Receive the returned value from the executed script
      console.log("Intensity", obj.value); // Log the intensity
      data.intensity = obj.value; // Set the intensity property to the retrieved value
    })

    // Sale/Discount %
    .execute(function(obj) { // Execute a script to retrieve the selected sale option value
      obj = jQuery('#sale > option:selected')[0].value; // Use jQuery to select the sale option and get its value
      return obj; // Return the value
    }, data).then(function(obj) { // Receive the returned value from the executed script
      var discount = obj.value; // Store the retrieved discount value in a variable
      console.log(`Discount ${discount}`); // Log the discount
      data.discount = discount; // Set the discount property to the retrieved value
      if (discount) { // If there is a discount
        data.salePrice = data.price - ((discount / 100) * data.price); // Calculate the sale price and set the salePrice property
      }
    })

    // Trailer URL
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-screenshot').then(function(val) { // Retrieve the video screenshot attribute from the rmpPlayer element
      data.poster = val; // Set the poster property to the retrieved URL
    })

    // Poster Img URL
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-filepath').then(function(val) { // Retrieve the video filepath attribute from the rmpPlayer element
      data.trailer = val; // Set the trailer property to the retrieved URL
    })

    /** CreatedAt Timestamp
     * Epoch milliseconds to UTC string
     */
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-filepath').then(function(val) { // Retrieve the video filepath attribute from the rmpPlayer element
      var epochMs = 0; // Initialize a variable to store the epoch milliseconds
      var d = new Date(0); // Create a new Date object set to the epoch
      // var val = "https://dntgjk0do84uu.cloudfront.net/364438/e1a1813a9e1abe9866c0b74118081a58/preview/1520188436784.mp4_480_1520188447.m3u8"; // test string
      var regex = /https:\/\/.*\/.*\/(\d{13}).mp4_\d{3,4}_\d{10}.m3u8/; // Define a regex to match the video filepath format
      var regex2 = /https:\/\/s3.amazonaws.com\/manyvids-data\/php_uploads\/preview_videos\/.*\/(\d{13})_preview.mp4/; // Define an alternative regex for a different video filepath format

      if (regex.test(val)) { // If the first regex matches the filepath
        var match = regex.exec(val); // Execute the regex to extract the match
        epochMs = match[1]; // Assign the extracted epoch milliseconds to the variable
      } else if (regex2.test(val)) { // If the second regex matches the filepath
        var match = regex2.exec(val); // Execute the regex to extract the match
        epochMs = match[1]; // Assign the extracted epoch milliseconds to the variable
      }

      // console.log(match, epochMs);
      // console.log("Converting to UTC String");
      d.setUTCMilliseconds(epochMs); // Set the Date object to the extracted epoch milliseconds
      data.createdAt = d.toISOString(); // Convert the Date object to a UTC string and set the createdAt property
    })

    // Success Callback
    .next(function() { // Proceed to the next step in the chain
      params.client.end(); // Ends the browser session
      console.log('Done!'); // Log that the process is done
      console.log(JSON.stringify(data, null, 2)); // Log the data object as a formatted JSON string
      return callback(null, data); // Return the data through the callback
    })

    // Global Error Callback
    .catch((e) => { // Catch any global errors
      console.log(e); // Log the error
      params.client.end(); // Ends the browser session if an error occurs
      return callback(e, {}); // Return the error through the callback
    });
};

// Put Vid - Details
// @param  {Integer}   id      A ManyVids Video ID
// @param  {Object}   params   client, cookie
// @param  {Function} callback [description]
// @return {Object}            An object containing details about a ManyVids video.
function postVid(id, data, params, callback) { // Define the postVid function to post video details
  // var data = {};
  // data.video = {};
  // data.website = "MANYVIDS";
  // data.categories = [];
  console.log(id, data, params); // Log the video ID, data, and parameters
  var localPath = 'X:\\S3Gateway\\NeroMedia\\xxxmultimedia-downloads\\' + data.filename; // Define the local path to the video file

  params.client
    // .setCookie(params.cookie)
    .waitForVisible('body > div.mv-profile', 30000) // Wait for the profile element to be visible
    .url(`https://www.manyvids.com/Edit-vid/${id}/`) // Navigate to the video edit page for the specified video ID
    .chooseFile(selector, localPath) // Choose the file to upload using the local path
    .url(`https://www.manyvids.com/Edit-vid/${id}/`) // Navigate to the video edit page again
    .pause(2000) // Pause for 2 seconds
    // Manyvids Session Details
    .getAttribute('html', 'data-session-details').then(function(val) { // Retrieve the session details attribute from the html element
      console.log('Session Details: ' + JSON.stringify(val)); // Log the session details
      data.session = JSON.parse(val); // Parse the session details and assign to data.session
      data.remoteStudioId = data.session.user_id; // Set the remoteStudioId property to the user_id from session details
    })

    // ManyVids Video ID
    .getAttribute('body', 'data-video-id').then(function(val) { // Retrieve the video ID attribute from the body element
      console.log('Video ID: ' + JSON.stringify(val)); // Log the video ID
      data.video.id = val; // Set the video.id property to the retrieved video ID
      data.remoteId = data.video.id; // Set the remoteId property to the video ID
    })

    // AWS eTag
    .getAttribute('body', 'data-etag').then(function(val) { // Retrieve the eTag attribute from the body element
      console.log('eTag: ' + JSON.stringify(val)); // Log the eTag
      data.video.etag = val; // Set the video.etag property to the retrieved eTag
    })

    // Trailer Filename
    .getAttribute('body', 'data-filename').then(function(val) { // Retrieve the filename attribute from the body element
      console.log('Filename: ' + JSON.stringify(val)); // Log the filename
      data.video.filename = val; // Set the video.filename property to the retrieved filename
    })

    // Price
    .getValue('[name="video_cost"]').then(function(val) { // Retrieve the value of the video_cost input field
      console.log('Price is: ' + JSON.stringify(val * 1)); // Log the price
      data.price = val * 1; // Set the price property to the retrieved value, converting it to a number
    })

    // Video Title
    .getValue('[name="video_title"]').then(function(val) { // Retrieve the value of the video_title input field
      console.log('Title is: ' + JSON.stringify(val)); // Log the title
      data.name = val; // Set the name property to the retrieved title
    })

    // Description
    .getText('[name="video_description"]').then(function(val) { // Retrieve the text of the video_description input field
      console.log('Title is: ' + JSON.stringify(val)); // Log the description
      data.description = val; // Set the description property to the retrieved text
    })

    // Categories/"Tags"
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[1]/input', 'value').then(function(val) { // Retrieve the value of the first category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[2]/input', 'value').then(function(val) { // Retrieve the value of the second category input field
      if (val) { // If the value is not empty
        data.categories.push(val); // Add the value to the categories array
      }
    })
    .