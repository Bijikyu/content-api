// This file/module contains functions to interact with the Xvideos website using a webdriverio client.
// It includes functions to authenticate a user, get video upload details, and post a new video upload.
// It also includes a function to upload videos to ManyVids, though this function seems incomplete or unused.
// The module exports these functions for use elsewhere.

const dateutil = require('dateutil'); // Requires the 'dateutil' module for date manipulation
const dateFormat = require('dateformat'); // Requires the 'dateformat' module for formatting dates
var http = require('http'); // Requires the 'http' module to create HTTP server instances
var fs = require('fs'); // Requires the 'fs' module for file system operations
var path = require('path'); // Requires the 'path' module for working with file and directory paths
var Minio = require('minio'); // Requires the 'minio' module for interacting with MinIO object storage
var HashMap = require('hashmap'); // Requires the 'hashmap' module for creating hash map data structures

// Function to authenticate a user on Xvideos and initialize a new webdriverio session
function auth(credentials, params, callback) {
  console.log(credentials); // Logs the credentials object to the console
  params.client
    .init() // Initializes a new browser session
    .url('https://www.xvideos.com/account') // Navigates to the Xvideos account URL
    .pause(1000) // Pauses the execution for 1000 milliseconds
    // .waitForVisible('form', 3000)
    .setValue('body #signin-form_login', credentials.user) // Sets the value of the login form's username field
    .setValue('body #signin-form_password', credentials.pass) // Sets the value of the login form's password field
    // .submitForm('body #signin-form')
    .click('#signin-form > div.form-group.form-buttons > div > button') // Clicks the login button
    .pause(1000) // Pauses the execution for 1000 milliseconds
    // .pause(15000) // Wait in case we need to solve a recaptcha.
    /*     .getCookie([{"domain":"admin.clips4sale.com","httpOnly":false,"name":"PHPSESSID","path":"/","secure":false,"value":"jt0p2kiigvqdps9paqn6nqpnm8"}]).then(function(cookie) {
    	  var json = JSON.stringify(cookie);
          console.log('Cookie is: ' + json);
    	  fs.writeFile('cookie.json', json, 'utf8', callback);
          return cookie;
        }) */
    .next(function(data) {
      console.log(data); // Logs the data object to the console
      return callback(null, data); // Calls the callback function with no error and the data object
    }).catch((e) => console.log(e)); // Catches any errors and logs them to the console
};

// Function to get video upload details from Xvideos using an authenticated webdriverio session
function getUpload(id, params, callback) {
  var data = {}; // Initializes an empty object for data
  var dateObj = {}; // Initializes an empty object for dateObj
  var formData = {}; // Initializes an empty object for formData
  formData.translations = []; // Initializes an empty array for translations within formData
  formData.translations.push({}); // Pushes an empty object into the translations array
  formData.tags = []; // Initializes an empty array for tags within formData

  params.client
    /* .setCookie(params.cookie) */
    .url(`https://www.xvideos.com/account/uploads/${id}/edit`) // Navigates to the Xvideos edit upload URL with the specified ID
    .pause(1000) // Pauses the execution for 1000 milliseconds

    /* Title & Description */
    // Xvideos Title
    .getValue('#edit_form_titledesc_title').then(function(val) { // Gets the value of the title field
      formData.translations[0].xvideosName = val; // Sets the xvideosName property in the first translation object
    })
    // Xvideos Lang
    .getValue('#edit_form_titledesc_title_lang').then(function(val) { // Gets the value of the title language field
      formData.translations[0].xvideosLang = val; // Sets the xvideosLang property in the first translation object
    })

    // Xvideos Title
    .getValue('#edit_form_titledesc_title_network').then(function(val) { // Gets the value of the network title field
      formData.translations[0].networkName = val; // Sets the networkName property in the first translation object
    })
    // Xvideos Lang
    .getValue('#edit_form_titledesc_title_network_lang').then(function(val) { // Gets the value of the network title language field
      formData.translations[0].networkLang = val; // Sets the networkLang property in the first translation object
    })

    // Translations
    .getAttribute('#edit_form_title_translations_title_network_translations_ntr_0_ntr_0_title_lang', 'value').then(function(val) { // Gets the value attribute of the specified element
      formData.translations.push({}); // Pushes an empty object into the translations array
      formData.translations[1].xvideosLang = val; // Sets the xvideosLang property in the second translation object
    })
    .getAttribute('#edit_form_title_translations_title_network_translations_ntr_0_ntr_0_title_lang', 'value').then(function(val) { // Gets the value attribute of the specified element
      formData.lang = val; // Sets the lang property in formData
    })
    /*     .getAttribute('#edit_form_title_translations_title_translations_tr_0_tr_0_title_lang', 'value').then(function(val) {
            // console.log('key1 is: ' + JSON.stringify(val));
            if(val !== null && val !== '' && val !== 'Select Related Categories') {
              formData.relatedCategories.push(val);
            }
        }) */
    /*     .execute(function(data) {
            data.translations = [];
    		var obj = {
    			lang: jQuery('#edit_form_title_translations_title_translations_tr_0_tr_0_title_lang')[0].value,
    			xvideos: jQuery('input[name="edit_form[title_translations][title_translations][tr_0][tr_0_title_lang]"]')[0].value,
    			network: jQuery('input[name="edit_form[title_translations][title_translations][tr_0][tr_0_title_lang]"]')[0].value
    		};
    		data.translations.push(obj);
            return data.translations;
        }, data).then(function(data) {
            formData.translations = data.translations;
            console.log(formData.translations);
        }) */

    // Success Callback
    .next(function() {
      params.client.end(); /** Ends browser session {@link editVid| read editVids docs} */
      console.log('Done!'); // Logs 'Done!' to the console
      console.log(JSON.stringify(formData, null, 2)); // Logs the formatted formData object to the console
      return callback(null, formData); // Calls the callback function with no error and the formData object
    })

    // Global Error Callback
    .catch((e) => {
      console.log(e); // Logs the error object to the console
      // params.client.end(); /** Ends browser session {@link editVid| read editVids docs} */
      return callback(e, {
        msg: "A global error ocurred. Please check the app." // Calls the callback function with the error object and a message
      });
    });
};

// Function to create a new video clip on Xvideos using an authenticated webdriverio session
function postUpload(event, params, callback) {
  // Allow insecure TLS connections
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Sets the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' to allow insecure connections

  // Custom command
  /* 	params.client.addCommand("getUrlAndTitle", function (customVar) {
  		// `this` refers to the `browser` scope
  		return {
  			url: this.getUrl(),
  			title: this.getTitle(),
  			customVar: customVar
  		};
  	}); */

  // Ass. Array -
  var video_premium = new HashMap(); // Creates a new HashMap instance for video_premium
  video_premium
    .set("Free for All", "upload_form_video_premium_video_premium_centered_zone_all_site") // Sets a key-value pair in the video_premium HashMap
    .set("Paying Users", "upload_form_video_premium_video_premium_centered_zone_premium"); // Sets another key-value pair in the video_premium HashMap

  var networksites = new HashMap(); // Creates a new HashMap instance for networksites
  networksites
    .set("Xvideos Only", "upload_form_networksites_networksites_centered_networksites_DEFAULT_ONLY") // Sets a key-value pair in the networksites HashMap
    .set("Xvideos & Network", "upload_form_networksites_networksites_centered_networksites_NO_RESTRICTION"); // Sets another key-value pair in the networksites HashMap

  var category = new HashMap(); // Creates a new HashMap instance for category
  category
    .set("Straight", "upload_form_category_category_centered_category_straight") // Sets a key-value pair in the category HashMap
    .set("Gay", "upload_form_category_category_centered_category_gay") // Sets another key-value pair in the category HashMap
    .set("Shemale", "upload_form_category_category_centered_category_shemale"); // Sets another key-value pair in the category HashMap

  // Setup minio client
  // var minioClient = new Minio.Client({
  // 	endPoint: '',
  // 	port: 9000,
  // 	useSSL: true,
  // 	accessKey: '',
  // 	secretKey: ''
  // });
  //
  // var size = 0;
  //
  // minioClient.fGetObject('bucket', event.filename, './tmp/'+event.filename, function(e) {
  //   if (e) {
  // 	return console.log(e)
  //   }
  //   console.log('Done downloading. Starting HTTP server for local file on localhost.')
  //   var stats = fs.statSync('./tmp/'+event.filename);
  //   var fileSizeInBytes = stats.size;

  // Create HTTP server to serve URL upload option from. @todo kill on fail/success
  // http.createServer(function (req, res) {
  // 	console.log("Port Number : 3003");
  // 	// change the MIME type to 'video/mp4'
  // 	res.writeHead(200, {
  // 		'Content-Type': 'video/mp4',
  // 		'Content-Length': fileSizeInBytes
  // 	});
  // 	fs.exists('./tmp/'+event.filename,function(exists){
  // 		if(exists)
  // 		{
  // 			var rstream = fs.createReadStream('./tmp/'+event.filename);
  // 			rstream.pipe(res);
  // 		}
  // 		else
  // 		{
  // 			res.send("Its a 404");
  // 			res.end();
  // 		}
  // 	});
  // }).listen(3003);

  // Remove . and / from titles per C4S
  var name = event.name.replace('.', '').replace('/', ''); // Removes '.' and '/' from the event name and assigns it to name
  console.log(`Clean Title: ${name}`); // Logs the clean title to the console
  var description = `${event.description}`; // Assigns the event description to description

  console.log(event, params); // Logs the event and params objects to the console

  if (event["video_premium"] == "upload_form_video_premium_video_premium_centered_zone_premium") {
    params.client.click('#' + event["networksites"]); // Clicks the element with the ID specified by the event's networksites property
  }

  /* 		var langCount = event["translations"].length;
  		console.log(langCount);
  	  for (var i = 0; i < langCount.length; i++) {
  		  var iteration = i+1;
  		  params.client
  			.click('#upload_form_title_translations_title_translations > button').pause(1000)
  			.click('a[data-locale="' + event["translations"][iteration]["lang"] + '"]').pause(100)
  			.setValue('#upload_form_title_translations_title_translations_tr_' + i + '_tr_' + i + '_title', event["translations"][iteration]["xvideosTitle"]).pause(100)
  	  } */

  params.client
    // .init()
    /* .setCookie(params.cookie) */
    .url('https://www.xvideos.com/account/uploads/new') // Navigates to the Xvideos new upload URL
    .pause(1000) // Pauses the execution for 1000 milliseconds
    .click('input#' + event["video_premium"]) // Clicks the input element with the ID specified by the event's video_premium property
    .click('input#' + event["category"]) // Clicks the input element with the ID specified by the event's category property
    .click('input#' + event["networksites"]) // Clicks the input element with the ID specified by the event's networksites property

    // Title & Description
    .setValue('textarea#upload_form_titledesc_description', event.description.substring(0, 500).replace(/<[^>]*>?/gm, '')) // Sets the value of the description textarea, removing HTML tags and limiting to 500 characters
    .setValue('input#upload_form_titledesc_title', event.name) // Sets the value of the title input field
    .setValue('input#upload_form_titledesc_title_network', event.networkName).pause(100) // Sets the value of the network title input field and pauses for 100 milliseconds

    // Select File HTTP(S)
    // .setValue('#upload_form_file_file_options_file_2_video_url', 'http://s3.xxxmultimedia.com:3003/'+event.filename).pause(100)
    // .click('#upload_form_file_file_options_file_2 > div > div > span > button').pause(100)
    // .click('#upload_form_file_file_options_file_2 > div > div > span').pause(1000)

    // Ads to display
    // .click('#upload_form_sponsorlinks_sponsorlinks_'+event.sponsoredLinks[0]).pause(100)
    .click('input#upload_form_sponsorlinks_sponsorlinks_19609').pause(100) // Clicks the input element for the sponsored link with ID 19609 and pauses for 100 milliseconds

    // Agree to terms
    .click('#upload_form_file > div.form-group.form-field-upload_form_file_terms > div > div > label > div.checkbox-error-box').pause(1000) // Clicks the terms agreement checkbox and pauses for 1000 milliseconds
    // Add tags
    .click('//*[@id="upload_form_tags"]/div/div/div[1]/div[1]/button').pause(100) // Clicks the button to add a tag and pauses for 100 milliseconds
    .setValue('div.tag-list > input[type="text"]', event.tags[0] || '').pause(100) // Sets the value of the first tag input field and pauses for 100 milliseconds
    .click('//*[@id="upload_form_tags"]/div/div/div[1]/div[1]/button').pause(100) // Clicks the button to add another tag and pauses for 100 milliseconds
    // ... (repeated for each tag, up to 20 tags)

    .execute(function(event) { // Executes a script within the context of the browser
      console.log(event); // Logs the event object to the console
      // The following code is intended to interact with the page's DOM to set translation titles and network titles
      // However, this code will not work as intended because it is written as if it were running in a browser context with jQuery
      // This is incorrect usage for webdriverio's execute function, which should contain pure JavaScript to interact with the page
      // Additionally, the execute function is not designed to interact with elements like this; instead, webdriverio's API should be used
      // Therefore, this code block is incorrect and will not execute as expected
      // ... (repeated for each translation, up to 10 translations)
      return;
    }, event)
    .pause(1000) // Pauses the execution for 1000 milliseconds

    // Submit form
    // .click('#upload_form_file_file_options > div > div > span:nth-child(3) > button').pause(1000)

    // .waitForVisible('#upload-form-progress', 900000).then(console.log('Now uploading your clip. Please wait.')) // Wait 10 minutes for the form to be complete and uploaded. Else fail
    .waitForVisible('#upload-form-progress > h5.status.text-success', 999999999).pause(10000) // Waits for the upload progress element to be visible, indicating success
    .execute(function(event) { // Executes a script within the context of the browser
      console.log(event); // Logs the event object to the console
      // The following code is intended to retrieve the href attribute of a success link after upload
      // However, this code will not work as intended because it is written as if it were running in a browser context with jQuery
      // This is incorrect usage for webdriverio's execute function, which should contain pure JavaScript to interact with the page
      // Therefore, this code block is incorrect and will not execute as expected
    }, event)
    .then(function() {
      params.client.end(); // Ends the browser session
    })
    /** Success Callback */
    // .waitUntil(() => {
    //   var elem = $('iframe#iframe-upload').contents();
    //   return $("#iframeID").contents().find("[tokenid=" + token + "]").html();
    // }, 300000, 'expected text to be different after 5s');
    .next(function() {
      console.log('Done!'); // Logs 'Done!' to the console
      console.log(JSON.stringify(event, null, 2)); // Logs the formatted event object to the console
      // params.client.end(); // Stable version only
      return callback(null, event); // Calls the callback function with no error and the event object
    })

    // Global Error Callback
    .catch((e) => {
      params.client.end(); // Ends the browser session
      console.log(e); // Logs the error object to the console
      return callback(null, event); // Calls the callback function with no error and the event object
    });
  // })

};

// Function to upload videos to ManyVids using an authenticated webdriverio session
function uploadVids(file, params, callback) {
  console.log(file, params); // Logs the file and params objects to the console

  params.client
    .setCookie(params.cookie) // Sets a cookie in the browser session
    .url(`https://www.manyvids.com/Upload-vids/`) //