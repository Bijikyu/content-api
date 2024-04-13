// This module provides functionality to upload files to an FTP server, either from a URL or an S3-compatible service.
// It includes two main functions: `upload` for handling uploads from S3 and `httpUpload` for handling uploads from a URL.
// Configuration is loaded from a JSON file located in the APPDATA directory.

var hyperquest = require('hyperquest'); // Require the hyperquest module for making HTTP requests
var fs = require('fs'); // Require the fs module for file system operations
var path = require('path'); // Require the path module for file path operations
var Client = require('ftp'); // Require the ftp module for FTP operations
var Minio = require('minio'); // Require the minio module for interacting with Minio/S3-compatible storage
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // Load configuration from a JSON file in the APPDATA directory

// The upload function handles the upload process for both video and non-video files to an FTP server
function upload(event, callback) {

  var dstFile = path.basename(event.url); // Extract the base name of the file from the URL

  console.log('File: ', dstFile) // Log the file name to the console

  // The search function looks for a file with a given name in an array of files
  function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].name === nameKey) {
        return myArray[i];
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance

  // Connect to the FTP server using credentials from the configuration file
  ftpClient.connect({
    host: 'ftp.vod.com',
    user: conf.setting.hotmovies.user,
    password: conf.setting.hotmovies.pass
  });

  // Event listener for when the FTP client is ready to perform operations
  ftpClient.on('ready', function() {

    // List the contents of the root directory on the FTP server
    ftpClient.list('/', function(err, data) {
      if (err) {
        console.log(err);
      }
      var obj = search(dstFile, data); // Search for the file in the directory listing
      console.log(obj); // Log the search result to the console

      // Check if the file already exists on the FTP server
      if (obj) {
        ftpClient.end(); // Close the FTP connection
        console.log('File already exists on destination server\'s filesystem.');
        callback(null, obj); // Invoke the callback with the file information
      } else {

        // Check if the event type is a video
        if (event.type == "video") {

          // Allow insecure TLS connections
          process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

          // Setup minio client with configuration from the config file
          var minioClient = new Minio.Client({
            endPoint: conf.setting.s3.endpoint,
            port: conf.setting.s3.port || 9000,
            useSSL: true,
            accessKey: conf.setting.s3.access_key,
            secretKey: conf.setting.s3.secret_key
          });

          var size = 0; // Initialize the size variable to track the size of the file

          // Get the object from the Minio/S3 server and stream it
          minioClient.getObject('vods', event.url, function(err, dataStream) {
            if (err) {
              return console.log(err)
            }
            dataStream.on('data', function(chunk) {
              size += chunk.length // Increment the size by the length of the chunk
            })
            dataStream.on('end', function() {
              console.log('End. Total size = ' + size) // Log the total size of the file
            })
            dataStream.on('error', function(err) {
              console.log(err) // Log any errors that occur during streaming
            })

            console.time("upload"); // Start a timer labeled "upload"

            // Pipe the data stream to the destination FTP server
            ftpClient.put(dataStream, dstFile, function(err) {
              if (err) {
                console.log(err);
              }
              ftpClient.end(); // Close the FTP connection
              console.timeEnd("upload"); // End the timer and log the time taken to upload
              console.log("Finished"); // Log that the upload is finished
            });
          });
        } else {

          // Grab from HTTP request and stream for non-video files
          var stream = hyperquest(event.url);
          console.time("upload"); // Start a timer labeled "upload"

          // Pipe the stream to the destination FTP server
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection
            console.timeEnd("upload"); // End the timer and log the time taken to upload
            console.log("Finished"); // Log that the upload is finished
          });
        }
      }
    });

  });

  // The upload function is defined but not used in this code snippet
  var upload = function() {
    ftpClient.size(dstFile, function(err, size) {
      var stream = hyperquest('event.url');
      if (err) {

        hyperquest('event.url').pipe(res)(function(res) {
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end();
            console.timeEnd("upload");
            console.log("Finished");
          });
        });

      } else {

        console.log("Resuming download at start: " + size);
        getFileFromS3(size, function(res) {

          ftpClient.append(res, dstFile, function(err) {
            if (err) {
              console.log(err);
            }

            ftpClient.end();
            console.timeEnd("upload");
            console.log("Finished");
          });
        });

      }
    });
  };

  // Event listener for when the FTP connection is closed
  ftpClient.on('close', function(hadError) {
    if (hadError) {
      console.log("FTP server closed with an error");
    } else {
      console.log("FTP server closed");
    }
  });

  // Event listener for errors on the FTP client
  ftpClient.on('error', function(err) {
    console.log("FTP server had error: " + err);
  });

  // Event listener for when the FTP connection ends
  ftpClient.on('end', function() {
    console.log("FTP server ended connection");
  });

  // Event listener for the greeting message from the FTP server
  ftpClient.on('greeting', function(msg) {
    console.log(msg);
  });

}

// The httpUpload function handles the upload process for files to an FTP server from a URL
function httpUpload(event, callback) {

  var dstFile = path.basename(event.url); // Extract the base name of the file from the URL
  var ext = path.extname(event.url); // Extract the file extension from the URL
  var dstPath; // Declare a variable to hold the destination path on the FTP server
  // Determine the destination path based on the file extension
  if (ext == ".mp4" || ".wmv" || ".mov" || ".avi") {
    dstPath = '/clips';
  } else if (ext == ".jpg" || ".gif" || ".png" || ".jpeg" || ".tiff" || ".tif") {
    dstPath = '/clip_images';
  }
  // Determine the destination path based on the event type
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
  console.log('File: ', dstFile) // Log the file name to the console

  // The search function looks for a file with a given name in an array of files
  function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].name === nameKey) {
        return myArray[i];
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance

  // Connect to the FTP server using credentials from the event or environment variables
  ftpClient.connect({
    host: 'aebnftp.dataconversions.biz',
    user: event["credentials"][0]["user"] || process.env.AEBN_USER,
    password: event["credentials"][0]["pass"] || process.env.AEBN_PASS
  });

  // Event listener for when the FTP client is ready to perform operations
  ftpClient.on('ready', function() {

    // Change directory on the FTP server to the destination path
    ftpClient.cwd(dstPath, function(err, currentDir) {
      if (err) throw err;
      console.log(`Directory changed to ${dstPath}`);

      // List the contents of the destination directory on the FTP server
      ftpClient.list(dstPath, function(err, data) {
        if (err) {
          console.log(err);
        }
        var obj = search(dstFile, data); // Search for the file in the directory listing
        console.log(obj); // Log the search result to the console

        // Check if the file already exists on the FTP server
        if (obj) {
          ftpClient.end(); // Close the FTP connection
          console.log('File already exists on destination server\'s filesystem.');
          callback(null, obj); // Invoke the callback with the file information
        } else {

          // Grab from HTTP request and stream
          var stream = hyperquest(event.url);
          console.time("upload"); // Start a timer labeled "upload"

          // Pipe the stream to the destination FTP server
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end(); // Close the FTP connection
            console.timeEnd("upload"); // End the timer and log the time taken to upload
            console.log("Finished"); // Log that the upload is finished
          });
        }
      });
    });
  });

  // The upload function is defined but not used in this code snippet
  var upload = function() {
    ftpClient.size(dstFile, function(err, size) {
      var stream = hyperquest('event.url');
      if (err) {

        hyperquest('event.url').pipe(res)(function(res) {
          ftpClient.put(stream, dstFile, function(err) {
            if (err) {
              console.log(err);
            }
            ftpClient.end();
            console.timeEnd("upload");
            console.log("Finished");
          });
        });

      } else {

        console.log("Resuming download at start: " + size);
        getFileFromS3(size, function(res) {

          ftpClient.append(res, dstFile, function(err) {
            if (err) {
              console.log(err);
            }

            ftpClient.end();
            console.timeEnd("upload");
            console.log("Finished");
          });
        });

      }
    });
  };

  // Event listener for when the FTP connection is closed
  ftpClient.on('close', function(hadError) {
    if (hadError) {
      console.log("FTP server closed with an error");
    } else {
      console.log("FTP server closed");
    }
  });

  // Event listener for errors on the FTP client
  ftpClient.on('error', function(err) {
    console.log("FTP server had error: " + err);
  });

  // Event listener for when the FTP connection ends
  ftpClient.on('end', function() {
    console.log("FTP server ended connection");
  });

  // Event listener for the greeting message from the FTP server
  ftpClient.on('greeting', function(msg) {
    console.log(msg);
  });

}

// Export the upload and httpUpload functions to be used by other modules
module.exports = {
  upload: upload,
  httpUpload: httpUpload
};