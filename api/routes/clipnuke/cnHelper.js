```javascript
// This module provides functionality to list objects from different S3-compatible buckets using the Minio client.

var hyperquest = require('hyperquest'); // Require the hyperquest module for making HTTP requests
var fs = require('fs'); // Require the fs module for file system operations
var path = require('path'); // Require the path module for working with file and directory paths
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // Load the configuration file from the specified path
var Client = require('ftp'); // Require the ftp module for FTP operations
var Minio = require('minio'); // Require the Minio module for working with S3-compatible storage services

// Allow insecure TLS connections
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Disable TLS/SSL certificate validation

// Setup minio client if the necessary configuration is provided
if (conf.settings.s3.endpoint && conf.settings.s3.access_key && conf.settings.s3.secret_key) {
  var minioClient = new Minio.Client({ // Create a new instance of the Minio client
    endPoint: conf.settings.s3.endpoint, // Set the endpoint for the S3-compatible storage service
    port: conf.settings.s3.port || 9000, // Set the port or default to 9000
    useSSL: conf.settings.s3.use_ssl || true, // Set whether to use SSL or default to true
    accessKey: conf.settings.s3.access_key, // Set the access key for authentication
    secretKey: conf.settings.s3.secret_key // Set the secret key for authentication
  });
}

// Function to list trailer object keys from a specified bucket
function getTrailerObjectKeys(params, callback) {
  var data = {}; // Initialize an empty object to store the data
  var size = 0; // Initialize size to 0
  var bucketName = params.bucketName || 'clipnuke'; // Set the bucket name or default to 'clipnuke'
  data.objects = []; // Initialize an empty array to store object keys
  data.objects.push({ // Add a placeholder object to the array
    name: "Select a File"
  });

  var stream = minioClient.listObjects(bucketName, 'trailers/', true) // Create a stream to list objects with prefix 'trailers/'
  stream.on('data', function(obj) { // Listen for 'data' events
    data.objects.push(obj); // Push each object key to the array
    console.log(obj) // Log the object key
  });

  stream.on('error', function(err) { // Listen for 'error' events
    console.log(err) // Log the error
    callback(err, data); // Call the callback function with the error and data
  });

  stream.on('end', function(err) { // Listen for 'end' events
    console.log(err) // Log the end of the stream
    callback(null, data); // Call the callback function with no error and the data
  });
}

// Function to list video object keys from a specified bucket
function getVideoObjectKeys(params, callback) {
  var data = {}; // Initialize an empty object to store the data
  var size = 0; // Initialize size to 0
  var bucketName = params.bucketName || 'xxxmultimedia-downloads'; // Set the bucket name or default to 'xxxmultimedia-downloads'
  data.objects = []; // Initialize an empty array to store object keys
  data.objects.push({ // Add a placeholder object to the array
    name: "Select a File"
  });

  var stream = minioClient.listObjects(bucketName, '', true) // Create a stream to list all objects in the bucket
  stream.on('data', function(obj) { // Listen for 'data' events
    data.objects.push(obj); // Push each object key to the array
    console.log(obj) // Log the object key
  });

  stream.on('error', function(err) { // Listen for 'error' events
    console.log(err) // Log the error
    callback(err, data); // Call the callback function with the error and data
  });

  stream.on('end', function(err) { // Listen for 'end' events
    console.log(err) // Log the end of the stream
    callback(null, data); // Call the callback function with no error and the data
  });
}

// Function to list VOD object keys from a specified bucket
function getVodObjectKeys(params, callback) {
  var data = {}; // Initialize an empty object to store the data
  var size = 0; // Initialize size to 0
  var bucketName = 'vods'; // Set the bucket name to 'vods'
  data.objects = []; // Initialize an empty array to store object keys
  data.objects.push({ // Add a placeholder object to the array
    name: "Select a File"
  });

  var stream = minioClient.listObjects(bucketName, '', true) // Create a stream to list all objects in the bucket
  stream.on('data', function(obj) { // Listen for 'data' events
    data.objects.push(obj); // Push each object key to the array
    console.log(obj) // Log the object key
  });

  stream.on('error', function(err) { // Listen for 'error' events
    console.log(err) // Log the error
    callback(err, data); // Call the callback function with the error and data
  });

  stream.on('end', function(err) { // Listen for 'end' events
    console.log(err) // Log the end of the stream
    callback(null, data); // Call the callback function with no error and the data
  });
}

// Export the functions to be used in other modules
module.exports = {
  getTrailerObjectKeys: getTrailerObjectKeys, // Export getTrailerObjectKeys function
  getVideoObjectKeys: getVideoObjectKeys, // Export getVideoObjectKeys function
  getVodObjectKeys // Export getVodObjectKeys function (shorthand property name)
};