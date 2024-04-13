// This file/module contains functions to interact with the Clips4Sale admin panel.
// It includes functions to authenticate a user, retrieve clip details, and post new clips.
// It utilizes the 'dateutil', 'dateformat', 'hashmap', and 'fs' libraries for various functionalities.

const dateutil = require('dateutil'); // require the 'dateutil' module for date manipulation
const dateFormat = require('dateformat'); // require the 'dateformat' module for formatting dates
var HashMap = require('hashmap'); // require the 'hashmap' module for creating a map (associative array)
var fs = require('fs'); // require the 'fs' module for file system operations
var path = require('path'); // require the 'path' module for handling and transforming file paths

// Create associative array for the clip title suffix
var map = new HashMap(); // create a new HashMap instance
map
  .set("HD_MP4", " - Full HD 1080p MP4") // set the key "HD_MP4" with its corresponding value in the map
  .set("SD_MP4", " - SD 480p MP4") // set the key "SD_MP4" with its corresponding value in the map
  .set("HD_WMV", " - Full HD 1080p WMV") // set the key "HD_WMV" with its corresponding value in the map
  .set("SD_WMV", " - SD 480p WMV") // set the key "SD_WMV" with its corresponding value in the map
  .set("MOBILE_HD", " - Mobile hd 720p MP4") // set the key "MOBILE_HD" with its corresponding value in the map
  .set("MOBILE_LOW", " - Mobile Low MP4"); // set the key "MOBILE_LOW" with its corresponding value in the map

// Function to authenticate a user and create a new webdriverio session
function auth(credentials, params, callback) {
  console.log(credentials); // log the credentials object to the console
  console.log("Session ID: ", params.client.sessionId) // log the session ID from the params object
  // TODO Get fresh session if sessionId is defined
  if (params.client.sessionId) { // check if sessionId is defined
    params.client.end(); // end the current session
  }
  // console.log(params.client);
  params.client
    .init().catch(function(err) { // initialize a new session and catch any errors
      params.client.end(); // end the session in case of an error
      console.log('WDIO.init() failed.', params); // log the error message and params
      return callback(`WDIO.init() failed.`, {}); // return the error message via callback
    }, params)
    .url('https://admin.clips4sale.com/login/index') // navigate to the login URL
    .waitForVisible('input#username', 3000) // wait for the username input to be visible
    .setValue('input#username', credentials.user) // set the username input value
    .setValue('input#password', credentials.pass).pause(200) // set the password input value and pause for 200ms
    // .submitForm('input.btn-primary')
    .click('input.btn.btn-primary') // click the login button
    .setCookie({ // set a cookie with the following details
      domain: "admin.clips4sale.com", // domain for the cookie
      name: "PHPSESSID", // name of the cookie
      secure: false, // security flag for the cookie
      value: credentials.phpsessid, // value of the cookie
      // expiry: seconds+3600 // When the cookie expires, specified in seconds since Unix Epoch
    })
    // .pause(15000) // Wait in case we need to solve a recaptcha.
    /*     .getCookie([{"domain":"admin.clips4sale.com","httpOnly":false,"name":"PHPSESSID","path":"/","secure":false,"value":"jt0p2kiigvqdps9paqn6nqpnm8"}]).then(function(cookie) {
    	  var json = JSON.stringify(cookie);
          console.log('Cookie is: ' + json);
    	  fs.writeFile('cookie.json', json, 'utf8', callback);
          return cookie;
        }) */
    .next(function(data) { // proceed to the next action in the chain
      console.log(data); // log the data to the console
      return callback(null, data); // return the data via callback
    }).catch((e) => console.log(e)); // catch any errors and log them to the console
};

// Function to retrieve clip details using an authenticated webdriverio session
function getClip(id, params, callback) {
  var data = {}; // create an empty object to store data
  var dateObj = {}; // create an empty object to store date components
  var formData = {}; // create an empty object to store form data
  formData.relatedCategories = []; // initialize an array for related categories
  formData.tags = []; // initialize an array for tags
  formData.website = "CLIPS4SALE"; // set the website property to "CLIPS4SALE"
  formData.remoteId = id * 1; // set the remoteId property, converting id to a number

  params.client
    // .setCookie(params.cookie)
    .url(`https://admin.clips4sale.com/clips/show/${id}`) // navigate to the clip details URL
    .waitForVisible('input[name="ClipTitle"]', 90000) // wait for the ClipTitle input to be visible
    .execute(function(data) { // execute a script in the browser context
      // Convert the raw HTML from tinyMCE into a JSON friendly version with himalaya
      data.description = tinyMCE.activeEditor.getContent({ // get the content from the tinyMCE editor
        format: "raw" // specify the format as raw
      });
      // data.description = tinyMCE.activeEditor.getContent({format: "raw"});
      return data.description; // return the description
    }, data).then(function(data) { // then handle the returned data
      // Convert the raw HTML from tinyMCE into a JSON friendly version with himalaya
      // Then we need to stringify for Graph.cool to escape the quotes
      /** @todo UPDATE: Okay so apparently JSON.stringify() causes problems when updating a record in Graphcool. So... */
      // formData.description = himalaya.parse(data.value);
      formData.description = data.value; // set the description in formData
      // formData.description = JSON.stringify(himalaya.parse(data.value));
    })
    .getValue('input[name="ClipTitle"]').then(function(val) { // get the value of the ClipTitle input
      console.log('Title is: ' + JSON.stringify(val)); // log the title
      formData.name = val; // set the name in formData
    })
    .getValue('input[name="producer_id"]').then(function(val) { // get the value of the producer_id input
      // console.log('Studio ID is: ' + JSON.stringify(val));
      formData.remoteStudioId = val * 1; // set the remoteStudioId in formData, converting val to a number
    })
    .execute(function(data) { // execute a script in the browser context
      data.price = document.frm_upload.clip_price.value; // get the clip price from the form
      return data.price; // return the price
    }, data).then(function(data) { // then handle the returned data
      formData.price = data.value * 1; // set the price in formData, converting data.value to a number
      // console.log(formData.price);
    })
    .getAttribute('#select2-keycat-container', 'title').then(function(val) { // get the title attribute of the keycat container
      // console.log('category is: ' + JSON.stringify(val));
      formData.category = val; // set the category in formData
    })
    .getAttribute('#select2-key1-container', 'title').then(function(val) { // get the title attribute of the key1 container
      // console.log('key1 is: ' + JSON.stringify(val));
      if (val !== null && val !== '' && val !== 'Select Related Categories') { // check if val is not null, empty, or the default text
        formData.relatedCategories.push(val); // push the value to the relatedCategories array in formData
      }
    })
    .getAttribute('#select2-key2-container', 'title').then(function(val) { // get the title attribute of the key2 container
      // console.log('key2 is: ' + JSON.stringify(val));
      if (val !== null && val !== '' && val !== 'Select Related Categories') { // check if val is not null, empty, or the default text
        formData.relatedCategories.push(val); // push the value to the relatedCategories array in formData
      }
    })
    .getAttribute('#select2-key3-container', 'title').then(function(val) { // get the title attribute of the key3 container
      // console.log('key3 is: ' + JSON.stringify(val));
      if (val !== null && val !== '' && val !== 'Select Related Categories') { // check if val is not null, empty, or the default text
        formData.relatedCategories.push(val); // push the value to the relatedCategories array in formData
      }
    })
    .getAttribute('#select2-key4-container', 'title').then(function(val) { // get the title attribute of the key4 container
      // console.log('key4 is: ' + JSON.stringify(val));
      if (val !== null && val !== '' && val !== 'Select Related Categories') { // check if val is not null, empty, or the default text
        formData.relatedCategories.push(val); // push the value to the relatedCategories array in formData
      }
    })
    .getAttribute('#select2-key5-container', 'title').then(function(val) { // get the title attribute of the key5 container
      // console.log('key5 is: ' + JSON.stringify(val));
      if (val !== null && val !== '' && val !== 'Select Related Categories') { // check if val is not null, empty, or the default text
        formData.relatedCategories.push(val); // push the value to the relatedCategories array in formData
      }
    })
    .getValue('input[name="keytype[0]"]').then(function(val) { // get the value of the first keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[1]"]').then(function(val) { // get the value of the second keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[2]"]').then(function(val) { // get the value of the third keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[3]"]').then(function(val) { // get the value of the fourth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[4]"]').then(function(val) { // get the value of the fifth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[5]"]').then(function(val) { // get the value of the sixth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[6]"]').then(function(val) { // get the value of the seventh keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[7]"]').then(function(val) { // get the value of the eighth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[8]"]').then(function(val) { // get the value of the ninth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[9]"]').then(function(val) { // get the value of the tenth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[10]"]').then(function(val) { // get the value of the eleventh keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[11]"]').then(function(val) { // get the value of the twelfth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[12]"]').then(function(val) { // get the value of the thirteenth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[13]"]').then(function(val) { // get the value of the fourteenth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="keytype[14]"]').then(function(val) { // get the value of the fifteenth keyword input
      // console.log('Keyword is: ' + JSON.stringify(val));
      if (val !== null && val !== '') { // check if val is not null or empty
        formData.tags.push(val); // push the value to the tags array in formData
      }
    })
    .getValue('input[name="DisplayOrder"]').then(function(val) { // get the value of the DisplayOrder input
      // console.log('DisplayOrder is: ' + JSON.stringify(val*1));
      formData.displayOrder = val * 1; // set the displayOrder in formData, converting val to a number
    })
    .getValue('input[name="ClipName"]').then(function(val) { // get the value of the ClipName input
      formData.filename = val; // set the filename in formData
    })
    .execute(function(data) { // execute a script in the browser context
      data.thumbnailFilename = $('#imageListDiv > select > option:selected')[0].value; // get the selected thumbnail filename
      return data.thumbnailFilename; // return the thumbnail filename
    }, data).then(function(data) { // then handle the returned data
      formData.thumbnailFilename = data.value; // set the thumbnailFilename in formData
      // console.log(formData.thumbnailFilename);
    })
    .getValue('input#ClipTime').then(function(val) { // get the value of the ClipTime input
      formData.lengthMinutes = val * 1; // set the lengthMinutes in formData, converting val to a number
      // console.log(formData.lengthMinutes);
    })
    .getValue('#producerUploadedPreview').then(function(val) { // get the value of the producerUploadedPreview input
      formData.trailerFilename = val; // set the trailerFilename in formData
    })
    .getValue("#fut_month").then(function(val) { // get the value of the future month input
      dateObj.mm = val; // set the month in dateObj
    })
    .getValue("#fut_day").then(function(val) { // get the value of the future day input
      dateObj.dd = val; // set the day in dateObj
    })
    .getValue("#fut_year").then(function(val) { // get the value of the future year input
      dateObj.yyyy = val; // set the year in dateObj
    })
    .getValue("#fut_hour").then(function(val) { // get the value of the future hour input
      dateObj.HH = val; // set the hour in dateObj
    })
    .getValue("#fut_minute").then(function(val) { // get the value of the future minute input
      dateObj.MM = val; // set the minute in dateObj
      // console.log(dateObj);
      // console.log(dateutil.parse(dateObj.yyyy+"-"+dateObj.mm+"-"+dateObj.dd+" "+dateObj.HH+":"+dateObj.MM).toISOString());
      formData.releaseDate = dateutil.parse(dateObj.yyyy + "-" + dateObj.mm + "-" + dateObj.dd + " " + dateObj.HH + ":" + dateObj.MM).toISOString(); // set the releaseDate in formData, converting the dateObj to an ISO string
    })

    // Success Callback
    .next(function() { // proceed to the next action in the chain
      params.client.end(); /** Ends