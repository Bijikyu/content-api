// This module sets up routes for handling WooCommerce related requests using Express.js

var wooRouter = require('express').Router({
  mergeParams: true
}); // create a new router instance for express with options to merge parameters from parent routes
var bodyParser = require('body-parser') // require the body-parser middleware to parse request bodies
var jsonParser = bodyParser.json() // create a middleware to parse JSON request bodies

// woocommerce Helper
const helper = require('./wooHelper.js'); // require a helper module for WooCommerce operations

wooRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'WooCommerce Router!'
  });
}); // define a GET route on the root path that responds with a JSON message

// route to trigger the capture
wooRouter.post('/', jsonParser, function(req, res) {
  var event = req.body; // store the parsed JSON body of the request in event
  console.log(JSON.stringify(event, null, 2)); // log the event to the console in a readable format

  helper.postProduct(event, function(err, data) {
    console.log(data); // log the response data from the helper
    res.json(data); // send the response data as JSON to the client
  });
}); // define a POST route on the root path to handle product creation with the help of the helper module

// route to trigger the capture
wooRouter.get('/product/:id', function(req, res) {
  var event = req.body; // store the parsed JSON body of the request in event
  const id = req.params.id; // extract the product id from the route parameters
  console.log(JSON.stringify(event, null, 2)); // log the event to the console in a readable format

  helper.getProduct(id, function(err, data) {
    console.log(data); // log the response data from the helper
    res.json(data); // send the response data as JSON to the client
  });
}); // define a GET route to fetch a product by id with the help of the helper module

module.exports = wooRouter; // export the router for use in other parts of the application