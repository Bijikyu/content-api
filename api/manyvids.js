// This file/module contains functions to authenticate with ManyVids and edit video details using a webdriverio client.

/**
 * Login to ManyVids.
 * Init a new webdriverio session.
 * @param  {webdriverio}   client   A webdriverio client
 * @param  {Function}      callback err, data
 * @return {Object}                 A webdriverio cookie containing the authenticated PHPSESSID
 */
function auth(params, callback) {
  params.client // Access the webdriverio client from the params object
    .init() // Initialize a new browser session
    .url('https://www.manyvids.com/Login/') // Navigate to the ManyVids login page
    .waitForVisible('button.js-warning18-popup', 3000) // Wait for the age verification button to be visible, up to 3 seconds
    .click('button.js-warning18-popup') // Click the age verification button
    .setValue('#triggerUsername', process.env.USER) // Set the username field to the value from environment variable USER
    .setValue('#triggerPassword', process.env.PASS) // Set the password field to the value from environment variable PASS
    .click('#loginAccountSubmit') // Click the login button to submit the form
    // .pause(15000) // Wait in case we need to solve a recaptcha.
    .getCookie('PHPSESSID').then(function(cookie) { // Retrieve the PHPSESSID cookie after successful login
      console.log('Cookie is: ' + JSON.stringify(cookie)); // Log the cookie to the console
      return cookie; // Return the cookie for further use
    })
    .next(function (data) { // Proceed to the next step in the chain with the retrieved data
      console.log(data); // Log the data to the console
      return callback(null, data); // Call the callback function with no error and the data
    }).catch((e) => console.log(e)); // Catch any errors and log them to the console
};

/**
 * Edit Vid - Details
 * Sends a GET request to the server, using an authenticated webdriverio session, fetches the data, then ends the session.
 * NOTE: It's super important to use .end() method to end the browser session. Because {@link auth | auth} calls init() to open a new browser session.
 * IMPORTANT: If we don't run browser.end(), this app will fail when {@link getVid | getVid} or another method is called!
 * @param  {Integer}   id      A ManyVids Video ID
 * @param  {Object}   params   client, cookie
 * @param  {Function} callback [description]
 * @return {Object}            An object containing details about a ManyVids video.
 */
function editVid(id, params, callback) {
  var data = {}; // Initialize an empty object to store video data
  data.video = {}; // Initialize an empty object within data to store video-specific information
  data.website = "MANYVIDS"; // Set the website property to "MANYVIDS"
  data.categories = []; // Initialize an empty array to store video categories
  console.log(id, params); // Log the video ID and params to the console

  params.client // Access the webdriverio client from the params object
    .setCookie(params.cookie) // Set the cookie to authenticate the session
    .url(`https://www.manyvids.com/Edit-vid/${id}/`) // Navigate to the video edit page for the specified video ID
    .pause(2000) // Pause for 2 seconds to allow the page to load

    // Manyvids Session Details
    .getAttribute('html', 'data-session-details').then(function(val) { // Retrieve the session details from the HTML element
      console.log('Session Details: ' + JSON.stringify(val)); // Log the session details to the console
      data.session = JSON.parse(val); // Parse the session details and store them in the data object
      data.remoteStudioId = data.session.user_id; // Store the user ID from the session details in the data object
    })

    // ManyVids Video ID
    .getAttribute('body', 'data-video-id').then(function(val) { // Retrieve the video ID from the body element
      console.log('Video ID: ' + JSON.stringify(val)); // Log the video ID to the console
      data.video.id = val; // Store the video ID in the data object
      data.remoteId = data.video.id; // Store the video ID in the data object as remoteId
    })

    // AWS eTag
    .getAttribute('body', 'data-etag').then(function(val) { // Retrieve the AWS eTag from the body element
      console.log('eTag: ' + JSON.stringify(val)); // Log the eTag to the console
      data.video.etag = val; // Store the eTag in the data object
    })

    // Trailer Filename
    .getAttribute('body', 'data-filename').then(function(val) { // Retrieve the trailer filename from the body element
      console.log('Filename: ' + JSON.stringify(val)); // Log the filename to the console
      data.video.filename = val; // Store the filename in the data object
    })

    // Price
    .getValue('[name="video_cost"]').then(function(val) { // Retrieve the video cost from the input element
      console.log('Price is: ' + JSON.stringify(val*1)); // Log the price to the console, converting it to a number
      data.price = val*1; // Store the price in the data object, converting it to a number
    })

    // Video Title
    .getValue('[name="video_title"]').then(function(val) { // Retrieve the video title from the input element
      console.log('Title is: ' + JSON.stringify(val)); // Log the title to the console
      data.name = val; // Store the title in the data object as name
    })

    // Description
    .getText('[name="video_description"]').then(function(val) { // Retrieve the video description from the textarea element
      console.log('Title is: ' + JSON.stringify(val)); // Log the description to the console
      data.description = val; // Store the description in the data object
    })

    // Categories/"Tags"
    // Retrieve the value of the first category input element and add it to the categories array if it exists
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[1]/input', 'value').then(function(val) {
      if(val) { data.categories.push(val); } // If the value is not empty, push it to the categories array
    })
    // Retrieve the value of the second category input element and add it to the categories array if it exists
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[2]/input', 'value').then(function(val) {
      if(val) { data.categories.push(val); } // If the value is not empty, push it to the categories array
    })
    // Retrieve the value of the third category input element and add it to the categories array if it exists
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[3]/input', 'value').then(function(val) {
      if(val) { data.categories.push(val); } // If the value is not empty, push it to the categories array
    })
    // Retrieve the value of the fourth category input element and add it to the categories array if it exists
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[4]/input', 'value').then(function(val) {
      if(val) { data.categories.push(val); } // If the value is not empty, push it to the categories array
    })
    // Retrieve the value of the fifth category input element and add it to the categories array if it exists
    .getAttribute('//*[@id="videoSettings"]/div[1]/div/ul/li[5]/input', 'value').then(function(val) {
      if(val) { data.categories.push(val); } // If the value is not empty, push it to the categories array
    })

    // Video Length
    .getAttribute('.js-video-length', 'data-video-length').then(function(val) { // Retrieve the video length from the element
      console.log(val); // Log the video length to the console
      if(val * 1) { // If the value can be converted to a number
        data.lengthSeconds = val * 1; // Store the video length in seconds in the data object
      } else {
        data.length = val; // Otherwise, store the video length as is in the data object
      }
    })

    // Intensity
    .execute(function(obj) { // Execute a script to retrieve the selected intensity option value
        obj = jQuery('#intensity > option:selected')[0].value; // Use jQuery to get the selected option value
        return obj; // Return the selected option value
    }, data).then(function(obj) { // Proceed with the returned object
        console.log("Intensity", obj.value); // Log the intensity to the console
        data.intensity = obj.value; // Store the intensity in the data object
    })

    /** Local Error Callback
     * @todo Break on various errors
     * @return error message, {}
     */
    .catch(function(err) { // Catch any errors in the chain
      console.log('Local catch called'); // Log that the local catch was called
      return callback("Error fetching the vid details.", {}); // Call the callback function with an error message and an empty object
    })

    // Sale/Discount %
    .execute(function(obj) { // Execute a script to retrieve the selected sale/discount option value
        obj = jQuery('#sale > option:selected')[0].value; // Use jQuery to get the selected option value
        return obj; // Return the selected option value
    }, data).then(function(obj) { // Proceed with the returned object
        var discount = obj.value; // Store the discount value in a variable
        console.log(`Discount ${discount}`); // Log the discount to the console
        data.discount = discount; // Store the discount in the data object
        if (discount) { // If there is a discount
          data.salePrice = data.price - ( ( discount / 100 ) * data.price ); // Calculate the sale price and store it in the data object
        }
    })

    // Trailer URL
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-filepath').then(function(val) { // Retrieve the trailer URL from the element
      data.poster = val; // Store the trailer URL in the data object as poster
    })

    // Poster Img URL
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-screenshot').then(function(val) { // Retrieve the poster image URL from the element
      data.trailer = val; // Store the poster image URL in the data object as trailer
    })

    /** CreatedAt Timestamp
     * Epoch milliseconds to UTC string
     */
    .getAttribute('//*[@id="rmpPlayer"]', 'data-video-filepath').then(function(val) { // Retrieve the video filepath from the element
      var epochMs = 0; // Initialize a variable to store the epoch milliseconds
      var d = new Date(0); // Create a new Date object set to the epoch
      // var val = "https://dntgjk0do84uu.cloudfront.net/364438/e1a1813a9e1abe9866c0b74118081a58/preview/1520188436784.mp4_480_1520188447.m3u8"; // test string
      var regex = /https:\/\/.*\/.*\/(\d{13}).mp4_\d{3,4}_\d{10}.m3u8/; // Regex to match the video filepath format
      var regex2 = /https:\/\/s3.amazonaws.com\/manyvids-data\/php_uploads\/preview_videos\/.*\/(\d{13})_preview.mp4/; // Alternative regex for a different filepath format

      if (regex.test(val)) { // If the first regex matches the filepath
        var match = regex.exec(val); // Execute the regex to get the match
        epochMs = match[1]; // Store the epoch milliseconds from the match
      } else if (regex2.test(val)) { // If the second regex matches the filepath
        var match = regex2.exec(val); // Execute the regex to get the match
        epochMs = match[1]; // Store the epoch milliseconds from the match
      }

      // var match = regex.exec(val);
      // var epochMs = match[1]; // Match regex group 1
      // console.log(match, epochMs);
      // console.log("Converting to UTC String");
      // var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCMilliseconds(epochMs); // Set the date object to the video creation time in epoch milliseconds
      data.createdAt = d.toISOString(); // Convert the date to a UTC timestamp and store it in the data object
    })

    // Success Callback
    .next(function() { // Proceed to the next step in the chain
      params.client.end(); // End the browser session
      console.log('Done!'); // Log that the process is done
      console.log(JSON.stringify(data, null, 2)); // Log the data object to the console in a formatted manner
      return callback(null, data); // Call the callback function with no error and the data object
    })

    // Global Error Callback
    .catch((e) => console.log(e)); // Catch any global errors and log them to the console
};

module.exports = { // Export the functions for use in other modules
  login: auth, // Export the auth function as login
  editVid: editVid // Export the editVid function
};