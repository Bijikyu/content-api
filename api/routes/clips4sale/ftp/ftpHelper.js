// This module provides functions to upload files to an FTP server, supporting different file types and sources.
// It includes functionality to connect to an FTP server, check if a file already exists, and upload files either
// from an HTTP source or from an S3-compatible storage service. It supports uploading general files, trailers, videos, and posters.

var hyperquest = require('hyperquest'); // Require the hyperquest module for making HTTP requests
var fs = require('fs'); // Require the fs module for file system operations
var path = require('path'); // Require the path module for file path operations
var Client = require('ftp'); // Require the ftp module for FTP operations
var Minio = require('minio'); // Require the minio module for interacting with S3-compatible storage

function upload(event, callback) { // Define the upload function with event and callback parameters

  var dstFile = path.basename(event.url); // Extract the base name of the file from the event URL
  var ext = path.extname(event.url); // Extract the file extension from the event URL
  var dstPath; // Declare a variable to hold the destination path on the FTP server
  if (ext == ".mp4" || ".wmv" || ".mov" || ".avi") { // Check if the file extension is a video format
    dstPath = '/clips'; // Set the destination path for video files
  } else if (ext == ".jpg" || ".gif" || ".png" || ".jpeg" || ".tiff" || ".tif") { // Check if the file extension is an image format
    dstPath = '/clip_images'; // Set the destination path for image files
  }
  switch (event.type) { // Switch on the event type
    case "trailer": // If the event type is trailer
      dstPath = '/clips_previews'; // Set the destination path for trailers
      break;
    case "video": // If the event type is video
      dstPath = '/clips'; // Set the destination path for videos
      break;
    case "poster": // If the event type is poster
      dstPath = '/clip_images'; // Set the destination path for posters
      break;
  }
  console.log('File: ', dstFile) // Log the file name to the console

  function search(nameKey, myArray) { // Define a search function to find an object by name in an array
    for (var i = 0; i < myArray.length; i++) { // Loop through the array
      if (myArray[i].name === nameKey) { // If the name property matches the nameKey
        return myArray[i]; // Return the matching object
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance

  ftpClient.connect({ // Connect to the FTP server with the provided credentials
    host: 'ftp.clips4sale.com', // FTP server host
    user: conf.settings.clips4sale.user, // FTP server username
    password: conf.settings.clips4sale.pass // FTP server password
  });

  ftpClient.on('ready', function() { // Event listener for when the FTP client is ready

    // Change directory on the FTP server
    ftpClient.cwd(dstPath, function(err, currentDir) { // Change the working directory on the FTP server
      if (err) throw err; // Throw an error if there is a problem changing directories
      console.log(`Directory changed to ${dstPath}`); // Log the new directory to the console

      ftpClient.list(dstPath, function(err, data) { // List the contents of the current directory on the FTP server
        if (err) { // If there is an error listing the directory contents
          console.log(err); // Log the error to the console
        }
        var obj = search(dstFile, data); // Search for the file in the directory listing
        console.log(obj); // Log the search result to the console

        if (obj) { // If the file already exists on the FTP server
          ftpClient.end(); // End the FTP client session
          console.log('File already exists on destination server\'s filesystem.'); // Log a message indicating the file exists
          callback(null, obj); // Invoke the callback with the existing file object
        } else { // If the file does not exist on the FTP server

          if (event.type == "video" || event.type == "trailer") { // If the event type is video or trailer

            // Allow insecure TLS connections
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Disable TLS certificate validation

            // Setup minio client
            var minioClient = new Minio.Client({ // Create a new Minio client instance with the provided S3-compatible storage settings
              endPoint: conf.settings.s3.endpoint, // S3-compatible storage endpoint
              port: conf.settings.s3.port, // S3-compatible storage port
              useSSL: conf.settings.s3.use_ssl || true, // Use SSL for S3-compatible storage connections
              accessKey: conf.settings.s3.access_key, // S3-compatible storage access key
              secretKey: conf.settings.s3.secret_key // S3-compatible storage secret key
            });

            var size = 0; // Initialize a variable to track the size of the file being downloaded

            // Grab our video file from an s3-compatible server and stream (dataStream)
            minioClient.getObject(conf.settings.s3.bucket_name, event.url, function(err, dataStream) { // Get the object from the S3-compatible storage and stream it
              if (err) { // If there is an error getting the object
                return console.log(err) // Log the error and return
              }
              dataStream.on('data', function(chunk) { // Event listener for data chunks being received
                size += chunk.length // Add the length of the chunk to the total size
              })
              dataStream.on('end', function() { // Event listener for when the data stream ends
                console.log('End. Total size = ' + size) // Log the total size of the downloaded file
              })
              dataStream.on('error', function(err) { // Event listener for errors in the data stream
                console.log(err) // Log the error
              })

              console.time("upload"); // Start a timer labeled "upload"

              // Pipe stream to destination FTP server
              ftpClient.put(dataStream, dstFile, function(err) { // Upload the data stream to the FTP server as dstFile
                if (err) { // If there is an error during the upload
                  console.log(err); // Log the error
                }
                ftpClient.end(); // End the FTP client session
                console.timeEnd("upload"); // Stop the timer labeled "upload"
                console.log("Finished"); // Log a message indicating the upload is finished
              });
            });
          } else { // If the event type is not video or trailer

            // Grab from HTTP request and stream
            var stream = hyperquest(event.url); // Create a stream from the HTTP request to the event URL
            console.time("upload"); // Start a timer labeled "upload"

            // Pipe stream to destination FTP server
            ftpClient.put(stream, dstFile, function(err) { // Upload the stream to the FTP server as dstFile
              if (err) { // If there is an error during the upload
                console.log(err); // Log the error
              }
              ftpClient.end(); // End the FTP client session
              console.timeEnd("upload"); // Stop the timer labeled "upload"
              console.log("Finished"); // Log a message indicating the upload is finished
            });
          }
        }
      });
    });

  });

  var upload = function() { // Define an upload function (this appears to be unused and may be a mistake in the original code)
    ftpClient.size(dstFile, function(err, size) { // Get the size of dstFile on the FTP server
      var stream = hyperquest('event.url'); // Create a stream from the HTTP request to the event URL (this appears to be a mistake, should be event.url without quotes)
      if (err) { // If there is an error getting the file size, which likely means the file does not exist

        hyperquest('event.url').pipe(res)(function(res) { // Create a stream from the HTTP request to the event URL and pipe it to res (this appears to be a mistake, should be event.url without quotes and res is not defined)
          ftpClient.put(stream, dstFile, function(err) { // Upload the stream to the FTP server as dstFile
            if (err) { // If there is an error during the upload
              console.log(err); // Log the error
            }
            ftpClient.end(); // End the FTP client session
            console.timeEnd("upload"); // Stop the timer labeled "upload"
            console.log("Finished"); // Log a message indicating the upload is finished
          });
        });

      } else { // If the file already exists on the FTP server

        console.log("Resuming download at start: " + size); // Log a message indicating the download will resume
        getFileFromS3(size, function(res) { // Get the file from S3 starting at the given size (getFileFromS3 is not defined in the provided code)

          ftpClient.append(res, dstFile, function(err) { // Append the data from res to dstFile on the FTP server
            if (err) { // If there is an error during the append operation
              console.log(err); // Log the error
            }

            ftpClient.end(); // End the FTP client session
            console.timeEnd("upload"); // Stop the timer labeled "upload"
            console.log("Finished"); // Log a message indicating the append operation is finished
          });
        });

      }
    });
  };

  ftpClient.on('close', function(hadError) { // Event listener for when the FTP client closes the connection
    if (hadError) { // If the connection was closed due to an error
      console.log("FTP server closed with an error"); // Log a message indicating the server closed with an error
    } else { // If the connection was closed without an error
      console.log("FTP server closed"); // Log a message indicating the server closed
    }
  });

  ftpClient.on('error', function(err) { // Event listener for errors on the FTP client
    console.log("FTP server had error: " + err); // Log the error message
  });

  ftpClient.on('end', function() { // Event listener for when the FTP client ends the connection
    console.log("FTP server ended connection"); // Log a message indicating the connection ended
  });

  ftpClient.on('greeting', function(msg) { // Event listener for the greeting message from the FTP server
    console.log(msg); // Log the greeting message
  });

}

function httpUpload(event, callback) { // Define the httpUpload function with event and callback parameters (this function appears to be a duplicate of the upload function above)

  var dstFile = path.basename(event.url); // Extract the base name of the file from the event URL
  var ext = path.extname(event.url); // Extract the file extension from the event URL
  var dstPath; // Declare a variable to hold the destination path on the FTP server
  if (ext == ".mp4" || ".wmv" || ".mov" || ".avi") { // Check if the file extension is a video format
    dstPath = '/clips'; // Set the destination path for video files
  } else if (ext == ".jpg" || ".gif" || ".png" || ".jpeg" || ".tiff" || ".tif") { // Check if the file extension is an image format
    dstPath = '/clip_images'; // Set the destination path for image files
  }
  switch (event.type) { // Switch on the event type
    case "trailer": // If the event type is trailer
      dstPath = '/clips_previews'; // Set the destination path for trailers
      break;
    case "video": // If the event type is video
      dstPath = '/clips'; // Set the destination path for videos
      break;
    case "poster": // If the event type is poster
      dstPath = '/clip_images'; // Set the destination path for posters
      break;
  }
  console.log('File: ', dstFile) // Log the file name to the console

  function search(nameKey, myArray) { // Define a search function to find an object by name in an array
    for (var i = 0; i < myArray.length; i++) { // Loop through the array
      if (myArray[i].name === nameKey) { // If the name property matches the nameKey
        return myArray[i]; // Return the matching object
      }
    }
  }

  var ftpClient = new Client(); // Create a new FTP client instance

  ftpClient.connect({ // Connect to the FTP server with the provided credentials
    host: 'ftp.clips4sale.com', // FTP server host
    user: conf.settings.clips4sale.user, // FTP server username
    password: conf.settings.clips4sale.pass // FTP server password
  });

  ftpClient.on('ready', function() { // Event listener for when the FTP client is ready

    /** Change directory on FTP server */
    ftpClient.cwd(dstPath, function(err, currentDir) { // Change the working directory on the FTP server
      if (err) throw err; // Throw an error if there is a problem changing directories
      console.log(`Directory changed to ${dstPath}`); // Log the new directory to the console

      ftpClient.list(dstPath, function(err, data) { // List the contents of the current directory on the FTP server
        if (err) { // If there is an error listing the directory contents
          console.log(err); // Log the error to the console
        }
        var obj = search(dstFile, data); // Search for the file in the directory listing
        console.log(obj); // Log the search result to the console

        if (obj) { // If the file already exists on the FTP server
          ftpClient.end(); // End the FTP client session
          console.log('File already exists on destination server\'s filesystem.'); // Log a message indicating the file exists
          callback(null, obj); // Invoke the callback with the existing file object
        } else { // If the file does not exist on the FTP server

          // Grab from HTTP request and stream
          var stream = hyperquest(event.url); // Create a stream from the HTTP request to the event URL
          console.time("upload"); // Start a timer labeled "upload"

          // Pipe stream to destination FTP server
          ftpClient.put(stream, dstFile, function(err) { // Upload the stream to the FTP server as dstFile
            if (err) { // If there is an error during the upload
              console.log(err); // Log the error
            }
            ftpClient.end(); // End the FTP client session
            console.timeEnd("upload"); // Stop the timer labeled "upload"
            console.log("Finished"); // Log a message indicating the upload is finished
          });
        }
      });
    });
  });

  var upload = function() { // Define an upload function (this appears to be unused and may be a mistake in the original code)
    ftpClient.size(dstFile, function(err, size) { // Get the size of dstFile on the FTP server
      var stream = hyperquest('event.url'); // Create a stream from the HTTP request to the event URL (this appears to be a mistake, should be event.url without quotes)
      if (err) { // If there is an error getting the file size, which likely means the file does not exist

        hyperquest('event.url').pipe(res)(function(res) { // Create a stream from the HTTP request to the event URL and pipe it to res (this appears to be a mistake, should be event.url without quotes and res is not defined)
          ftpClient.put(stream, dstFile, function(err) { // Upload the stream to the FTP server as dstFile
            if (err) { // If there is an error during the upload
              console.log(err); // Log the error
            }
            ftpClient.end(); // End the FTP client session
            console.timeEnd("upload"); // Stop the timer labeled "upload"
            console.log("Finished"); // Log a message indicating the upload is finished
          });
        });

      } else { // If the file already exists on the FTP server

        console.log("Resuming download at start: " + size); // Log a message indicating the download will resume
        getFileFromS3(size, function(res) { // Get the file from S3 starting at the given size (getFileFromS3 is not defined in the provided code)

          ftpClient.append(res, dstFile, function(err) { // Append the data from res to dstFile on the FTP server
            if (err) { // If there is an error during the append operation
              console.log(err); // Log the error
            }

            ftpClient.end(); // End the FTP client session
            console.timeEnd("upload"); // Stop the timer labeled "upload"
            console.log("Finished"); // Log a message indicating the append operation is finished
          });
        });

      }
    });
  };

  ftpClient.on('close', function(hadError) { // Event listener for when the FTP client closes the connection
    if (hadError) { // If the connection was closed due to an error
      console.log("FTP server closed with an error"); // Log a message indicating the server closed with an error
    } else { // If the connection was closed without an error
      console.log("FTP server closed"); // Log a message indicating the server closed
    }
  });

  ftpClient.on('error', function(err) { // Event listener for errors on the FTP client
    console.log("FTP server had error: " + err); // Log the error message
  });

  ftpClient.on('end', function() { // Event listener for when the FTP client ends the connection
    console.log("FTP server ended connection"); // Log a message indicating the connection ended
  });

  ftpClient.on('greeting', function(msg) { // Event listener for the greeting message from the FTP server
    console.log(msg); // Log the greeting message
  });

}

module.exports = { // Export the upload and httpUpload functions as a module
  upload: upload, // Export the upload function
  httpUpload: httpUpload // Export the httpUpload function
};