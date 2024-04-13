// This module sets up an Express router for handling API routes related to local file operations and video transcoding.
const local = require('express').Router({
  mergeParams: true
}); // creates a new router instance for handling API requests with merged parameter options
const path = require('path'); // includes the path module for handling file paths
const fs = require('fs'); // includes the file system module for file operations
const bodyParser = require('body-parser') // includes the body-parser middleware for parsing request bodies
const jsonParser = bodyParser.json() // creates a middleware for parsing JSON request bodies
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // loads the configuration file from the specified path
const spawn = require('child_process').spawn; // includes the spawn function from the child_process module for creating child processes

// Define route handlers for the local API
// Test Route
local.get('/', (req, res) => {
  res.status(200).json({
    message: 'Local API'
  }); // sends a JSON response with a message indicating the local API is reachable
});

// List Clips
local.get('/files', function(req, res) {
  // Where our files are stored
  const directoryPath = path.join(conf.settings.local.dir.videos || "%USERPROFILE%/Videos"); // constructs the directory path from configuration or defaults to user's Videos folder
  //passsing directoryPath and callback function
  fs.readdir(directoryPath, function(err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err); // logs an error message if unable to read the directory
    }
    var arr = []; // initializes an array to hold file names
    var itemsProcessed = 0; // initializes a counter for processed items

    function callback() {
      res.status(200).json({
        files: arr
      }); // sends a JSON response with the array of files
      console.log('all done'); // logs a message indicating all files have been processed
    }
    //listing all files using forEach
    files.forEach(function(file, index, array) {
      // Do whatever you want to do with the file
      arr.push(file); // adds the file name to the array
      console.log(file); // logs the file name
      itemsProcessed++; // increments the processed items counter
      if (itemsProcessed === array.length) {
        callback(); // calls the callback function once all files have been processed
      }
    }, arr); // passes the array as the second argument to forEach (though it's not used)
  }, res); // passes the response object as the second argument to readdir (though it's not used)
});

// Transcode video files using FFMpeg
local.post('/ffmpeg/transcode', jsonParser, function(req, res) {
  const event = req.body; // stores the request body in a variable
  const input = event.input; // stores the input file path from the request body
  var input_path = path.dirname(input); // gets the directory name of the input file
  var basename = path.basename(input, ".mxf"); // gets the base name of the input file without the .mxf extension
  const ext = path.extname(input); // gets the file extension of the input file
  // const path = path.parse(event.input); // this line is commented out and not used
  // const filename = req.body.input; // this line is commented out and not used
  var cmd = ""; // initializes an empty command string (though it's not used)
  // Spawn child processes for transcoding with different settings
  const child1 = spawn('ffmpeg', ['-i', `${input}`, '-i', conf.settings.ffmpeg.watermark.hd, '-filter_complex', '[0:v]scale=1920:1080[scaled];[scaled][1:v]overlay=0:0', '-c:v', 'h264_nvenc', '-profile:v', 'main', '-level:v', '4.1', '-c:a', 'copy', '-acodec', 'aac', '-ab', '128k', '-b:v', '6000k', `${input_path}/${basename}_hd.mp4`]);
  const child2 = spawn('ffmpeg', ['-i', `${input}`, '-i', conf.settings.ffmpeg.watermark.sd.mp4, '-filter_complex', '[0:v]scale=720:480[scaled];[scaled][1:v]overlay=0:0', '-c:v', 'h264_nvenc', '-profile:v', 'main', '-level:v', '3.0', '-c:a', 'copy', '-acodec', 'aac', '-ab', '128k', '-b:v', '2500k', `${input_path}/${basename}_sd.mp4`]);
  const child3 = spawn('ffmpeg', ['-i', `${input}`, '-i', conf.settings.ffmpeg.watermark.hd, '-filter_complex', '[0:v]scale=1920:1080[scaled];[scaled][1:v]overlay=0:0', '-b', '6000k', '-vcodec', 'wmv2', '-acodec', 'wmav2', `${input_path}/${basename}_hd.wmv`]);
  const child4 = spawn('ffmpeg', ['-i', `${input}`, '-i', conf.settings.ffmpeg.watermark.sd.wmv, '-filter_complex', '[0:v]scale=854:480[scaled];[scaled][1:v]overlay=0:0', '-b', '2000k', '-vcodec', 'wmv2', '-acodec', 'wmav2', `${input_path}/${basename}_sd.wmv`]);
  child1.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`); // logs the exit code of the child process
    if (code === 0) {
      res.status(200).json({
        message: 'FFMpeg/transcode ran successfully.'
      }); // sends a JSON response indicating success if the exit code is 0
    } else {
      res.status(200).json({
        message: `Error Code ${code}`,
        code: code
      }); // sends a JSON response with the error code if the exit code is not 0
    }
  });
  child1.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`); // logs the standard output from the child process
    // res.status(200).json(data); // this line is commented out and not used
  });
  child1.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`); // logs the standard error from the child process
    // res.status(400).json(data); // this line is commented out and not used
  });
});

module.exports = local; // exports the router for use in other modules