// This module provides functionality for uploading files to an FTP server, with support for both direct HTTP downloads and S3-compatible storage downloads.

var hyperquest = require('hyperquest'); // Require the hyperquest module for making HTTP requests.
var fs = require('fs'); // Require the file system module for file operations.
var path = require('path'); // Require the path module for handling file paths.
var Client = require('ftp'); // Require the FTP client module for FTP operations.
var Minio = require('minio'); // Require the Minio module for interacting with S3-compatible storage.

// Load the configuration from a JSON file located in the APPDATA/clipnuke directory.
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json"));

// Define the upload function which handles the upload process.
function upload(event, callback) {

  var dstFile = path.basename(event.url); // Extract the base name of the file from the URL.

  console.log('File: ', dstFile) // Log the file name to the console.

  // Define a search function to find an object by name in an array.
  function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].name === nameKey) {
        return myArray[i];
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance.

  // Connect to the FTP server using credentials from the configuration file.
  ftpClient.connect({
    host: 'uploads.adultempirecash.com',
    user: conf.settings.adultempire.user,
    password: conf.settings.adultempire.pass
  });

  // Event listener for when the FTP client is ready.
  ftpClient.on('ready', function() {

    // List the files in the root directory of the FTP server.
    ftpClient.list('/', function(err, data) {
      if (err) {
        console.log(err);
      }
      var obj = search(dstFile, data); // Search for the destination file in the list.
      console.log(obj); // Log the search result object.

      // Check if the file already exists on the FTP server.
      if (obj) {
        ftpClient.end(); // Close the FTP connection.
        console.log('File already exists on destination server\'s filesystem.');
        callback(null, obj); // Invoke the callback with the search result object.
      } else {

        // Check if the event type is "video".
        if (event.type == "video") {

          // Allow insecure TLS connections.
          process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

          // Setup Minio client with configuration from the config file.
          var minioClient = new Minio.Client({
            endPoint: conf.settings.s3.endpoint,
            port: conf.settings.s3.port,
            useSSL: true,
            accessKey: conf.settings.s3.access_key,
            secretKey: conf.settings.s3.secret_key
          });

          var size = 0; // Initialize the size variable to track the size of the data stream.

          // Get the object from the S3-compatible server and stream it.
          minioClient.getObject('vods', event.url, function(err, dataStream) {
            if (err) {
              return console.log(err)
            }
            dataStream.on('data', function(chunk) {
              size += chunk.length // Increment the size by the length of the chunk.
            })
            dataStream.on('end', function() {
              console.log('End. Total size = ' + size) // Log the total size of the data stream.
            })
            dataStream.on('error', function(err) {
              console.log(err) // Log any errors that occur during streaming.
            })

            console.time("upload"); // Start a timer labeled "upload".

            // Pipe the data stream to the destination FTP server.
            ftpClient.put(dataStream, dstFile, function(err) {
              if (err) {
                console.log(err);
              }
              ftpClient.end(); // Close the FTP connection.
              console.timeEnd("upload"); // End the timer and log the duration.
              console.log("Finished"); // Log that the upload is finished.
            });
          });
        } else {

          // Create a stream from the HTTP request.
          var stream = hyperquest(event.url);
          console.time("upload"); // Start a timer labeled "upload".

          // Pipe the HTTP stream to the destination FTP server.
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        }
      }
    });

  });

  // Define the upload function to check the size of the file and upload it.
  var upload = function() {
    ftpClient.size(dstFile, function(err, size) {
      var stream = hyperquest('event.url'); // Create a stream from the HTTP request.
      if (err) {

        // Pipe the HTTP request to the response.
        hyperquest('event.url').pipe(res)(function(res) {
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        });

      } else {

        console.log("Resuming download at start: " + size); // Log the starting point for resuming the download.
        getFileFromS3(size, function(res) {

          // Append the data to the file on the FTP server.
          ftpClient.append(res, dstFile, function(err) {
            if (err) {
              console.log(err);
            }

            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        });

      }
    });
  };

  // Event listener for when the FTP connection is closed.
  ftpClient.on('close', function(hadError) {
    if (hadError) {
      console.log("FTP server closed with an error"); // Log that the server closed with an error.
    } else {
      console.log("FTP server closed"); // Log that the server closed normally.
    }
  });

  // Event listener for errors on the FTP server.
  ftpClient.on('error', function(err) {
    console.log("FTP server had error: " + err); // Log the error message.
  });

  // Event listener for when the FTP server ends the connection.
  ftpClient.on('end', function() {
    console.log("FTP server ended connection"); // Log that the server ended the connection.
  });

  // Event listener for the greeting message from the FTP server.
  ftpClient.on('greeting', function(msg) {
    console.log(msg); // Log the greeting message.
  });

}

// Define the httpUpload function which handles the upload process for HTTP uploads.
function httpUpload(event, callback) {

  var dstFile = path.basename(event.url); // Extract the base name of the file from the URL.
  var ext = path.extname(event.url); // Extract the file extension from the URL.
  var dstPath; // Declare a variable to hold the destination path.
  // Check the file extension and set the destination path accordingly.
  if (ext == ".mp4" || ".wmv" || ".mov" || ".avi") {
    dstPath = '/clips';
  } else if (ext == ".jpg" || ".gif" || ".png" || ".jpeg" || ".tiff" || ".tif") {
    dstPath = '/clip_images';
  }
  // Check the event type and set the destination path accordingly.
  switch (event.type) {
    case "trailer":
      dstPath = '/clips_previews';
      break;
    case "video":
      dstPath = '/clips';
      break;
    case "poster":
      dstPath = '/clip_images';
      break;
  }
  console.log('File: ', dstFile) // Log the file name to the console.

  // Define a search function to find an object by name in an array.
  function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].name === nameKey) {
        return myArray[i];
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance.

  // Connect to the FTP server using credentials from the configuration file.
  ftpClient.connect({
    host: 'aebnftp.dataconversions.biz',
    user: conf.settings.adultempire.user,
    password: conf.settings.adultempire.pass
  });

  // Event listener for when the FTP client is ready.
  ftpClient.on('ready', function() {

    // Change the working directory on the FTP server to the destination path.
    ftpClient.cwd(dstPath, function(err, currentDir) {
      if (err) throw err;
      console.log(`Directory changed to ${dstPath}`); // Log the change of directory.

      // List the files in the destination directory on the FTP server.
      ftpClient.list(dstPath, function(err, data) {
        if (err) {
          console.log(err);
        }
        var obj = search(dstFile, data); // Search for the destination file in the list.
        console.log(obj); // Log the search result object.

        // Check if the file already exists on the FTP server.
        if (obj) {
          ftpClient.end(); // Close the FTP connection.
          console.log('File already exists on destination server\'s filesystem.');
          callback(null, obj); // Invoke the callback with the search result object.
        } else {

          // Create a stream from the HTTP request.
          var stream = hyperquest(event.url);
          console.time("upload"); // Start a timer labeled "upload".

          // Pipe the HTTP stream to the destination FTP server.
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        }
      });
    });
  });

  // Define the upload function to check the size of the file and upload it.
  var upload = function() {
    ftpClient.size(dstFile, function(err, size) {
      var stream = hyperquest('event.url'); // Create a stream from the HTTP request.
      if (err) {

        // Pipe the HTTP request to the response.
        hyperquest('event.url').pipe(res)(function(res) {
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        });

      } else {

        console.log("Resuming download at start: " + size); // Log the starting point for resuming the download.
        getFileFromS3(size, function(res) {

          // Append the data to the file on the FTP server.
          ftpClient.append(res, dstFile, function(err) {
            if (err) {
              console.log(err);
            }

            ftpClient.end(); // Close the FTP connection.
            console.timeEnd("upload"); // End the timer and log the duration.
            console.log("Finished"); // Log that the upload is finished.
          });
        });

      }
    });
  };

  // Event listener for when the FTP connection is closed.
  ftpClient.on('close', function(hadError) {
    if (hadError) {
      console.log("FTP server closed with an error"); // Log that the server closed with an error.
    } else {
      console.log("FTP server closed"); // Log that the server closed normally.
    }
  });

  // Event listener for errors on the FTP server.
  ftpClient.on('error', function(err) {
    console.log("FTP server had error: " + err); // Log the error message.
  });

  // Event listener for when the FTP server ends the connection.
  ftpClient.on('end', function() {
    console.log("FTP server ended connection"); // Log that the server ended the connection.
  });

  // Event listener for the greeting message from the FTP server.
  ftpClient.on('greeting', function(msg) {
    console.log(msg); // Log the greeting message.
  });

}

// Export the upload and httpUpload functions to be used by other modules.
module.exports = {
  upload: upload,
  httpUpload: httpUpload
};