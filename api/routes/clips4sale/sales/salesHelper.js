// This file defines a module that interacts with the Clips4Sale admin interface to retrieve sales reports.
// It uses the request module for HTTP requests and WebdriverIO for browser automation.

var request = require('request'); // Require the 'request' module for making HTTP requests
var request = request.defaults({
  jar: true // Enable cookies for the session by using a cookie jar
});

// Function to retrieve a sales report from Clips4Sale admin interface
function getReport(credentials, params, query, callback) {
  var reponse = {}; // Initialize an empty object to store the response

  // Use WebdriverIO client to navigate and interact with the Clips4Sale admin page
  params.client
    .url('https://admin.clips4sale.com/sales-reports/index') // Navigate to the sales reports page
    .waitForVisible('table#sales-report-table', 9000) // Wait for the sales report table to become visible
    .executeAsync(function(query, cb) { // Execute an asynchronous script within the browser context
      var reqData = { // Prepare the data object for the POST request
        s_year : query.s_year, // Start year for the report
        s_month : query.s_month, // Start month for the report
        s_day : query.s_day, // Start day for the report
        e_year : query.e_year, // End year for the report
        e_month : query.e_month, // End month for the report
        e_day : query.e_day, // End day for the report
        report_type : query.report_type || "Detail1", // Type of report to generate
        stores : query.stores || "all", // Stores to include in the report
        action : query.action || "reports" // Action to perform
      };
      $.ajax({ // Perform an AJAX request to get the report data
        type: "POST", // HTTP method is POST
        async: false, // Make the request synchronous
        url: "https://admin.clips4sale.com/sales/json", // URL to send the request to
        data: reqData, // Data to send in the request
        success: function(res) { // Success callback
          console.log(res); // Log the response for debugging
          cb(res); // Pass the response to the callback
        },
        dataType: "json" // Expect a JSON response
      });
    }, query).then(function(output) { // Handle the promise returned by executeAsync
      reponse.data = output.value; // Assign the response data to the reponse object
      console.log(reponse.data); // Log the response data for debugging
    })
    .next(function() { // Chain the next action after the promise is resolved
      params.client.end(); // Ends the WebdriverIO browser session
      console.log('Done!'); // Log a completion message
      console.log(JSON.stringify(reponse, null, 2)); // Log the formatted response object
      return callback(null, reponse); // Invoke the callback with the response data
    })
    .catch((e) => { // Handle any errors that occur during the WebdriverIO operations
      console.log(e); // Log the error
      params.client.end(); // Ends the WebdriverIO browser session
      return callback(e, e); // Invoke the callback with the error
    });
}

module.exports = { // Export the getReport function to be used by other modules
  getReport: getReport
};