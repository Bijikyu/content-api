// This module sets up an FTP route for an Express application, parses JSON request bodies, 
// reads configuration from a file, and handles POST requests to upload data using ftpHelper.

var ftp = require('express').Router({ // require and create a new Router instance from express with merged parameters
  mergeParams: true
});
var path = require('path'); // require the path module to work with file and directory paths
var bodyParser = require('body-parser') // require the body-parser module to parse incoming request bodies
var jsonParser = bodyParser.json() // create a middleware to parse JSON bodies

// clips4sale Helper
const ftpHelper = require('./ftpHelper.js'); // require the ftpHelper module for handling FTP uploads

const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // load configuration from a JSON file in the APPDATA directory

// Define the POST route for the FTP service
ftp.post('/', jsonParser, function(req, res) { // create a POST route that uses jsonParser middleware to parse the request body
  var event = req.body; // store the parsed request body in a variable
  const credentials = { // create an object to store FTP credentials from the configuration
    user: conf.settings.clips4sale.user, // get the FTP username from the configuration
    pass: conf.settings.clips4sale.pass // get the FTP password from the configuration
  };
  event.credentials = []; // initialize an array to store credentials in the event object
  event.credentials.push(credentials); // add the FTP credentials to the event object
  console.log(event); // log the event object to the console
  ftpHelper.httpUpload(req.body, function(err, data) { // call the ftpHelper's httpUpload function with the request body and a callback
    if (err) { // check if there was an error during the upload
      callback(err, data); // if there was an error, call the callback function with the error and data
    } else { // if there was no error
      console.log(data); // log the data to the console
      res.status(200).json(data); // send a 200 OK response with the data as JSON
    }
  });
});

module.exports = ftp; // export the ftp Router for use in other modules
