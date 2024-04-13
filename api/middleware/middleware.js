// This module defines a middleware function for setting CORS (Cross-Origin Resource Sharing) headers.
var cors = function (req, res, next) { // cors is a function that takes request, response, and next as arguments
    res.setHeader('Access-Control-Allow-Origin', '*'); // Sets the Access-Control-Allow-Origin header to allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Sets the Access-Control-Allow-Methods header to specify the allowed HTTP methods
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Sets the Access-Control-Allow-Headers header to specify the allowed headers in requests
    res.setHeader('Access-Control-Allow-Credentials', true); // Sets the Access-Control-Allow-Credentials header to allow credentials (such as cookies) to be included in requests
    next(); // Calls the next middleware function in the stack
}

module.exports = { cors }; // Exports the cors function for use in other modules
