// This module provides a function to translate text using a translation service API.
// It requires an API key and a callback function to handle the response.

function translate(event, apiKey, callback) { // Defines the translate function with parameters for the event data, API key, and a callback function.
  console.log(event); // Logs the event object to the console.
  const request = require('request'); // Requires the 'request' module to make HTTP requests.
  const uuidv4 = require('uuid/v4'); // Requires the 'uuid/v4' module to generate unique identifiers.
  
  // Checks if the API key is provided, and if not, throws an error.
  const subscriptionKey = apiKey; // Assigns the provided API key to a constant.
  if (!subscriptionKey) { // Checks if the subscriptionKey is not set.
    throw new Error('Environment variable for your subscription key is not set.') // Throws an error if the subscription key is not provided.
  };
  
  // Sets up the options for the HTTP request to the translation service.
  let options = { // Defines the options for the HTTP request.
    method: 'POST', // Sets the HTTP method to POST.
    baseUrl: 'https://api.cognitive.microsofttranslator.com/', // Sets the base URL for the translation service.
    url: 'translate', // Appends the 'translate' endpoint to the base URL.
    qs: { // Defines the query string parameters.
      'api-version': '3.0', // Sets the API version parameter.
      'to': event.lang // Sets the target language parameter to the language specified in the event object.
    },
    headers: { // Defines the headers for the HTTP request.
      'Ocp-Apim-Subscription-Key': subscriptionKey, // Sets the subscription key header with the provided API key.
      'Content-type': 'application/json', // Sets the content type header to 'application/json'.
      'X-ClientTraceId': uuidv4().toString() // Sets a unique client trace ID for the request using a UUID.
    },
    body: [{ // Sets the body of the POST request.
      'text': event.text // Includes the text to be translated from the event object.
    }],
    json: true, // Indicates that the request body is JSON.
  };
  
  // Makes the HTTP request to the translation service and handles the response.
  request(options, function(err, res, body) { // Calls the request function with the options and a callback function to handle the response.
    if (err) { // Checks if there was an error in the request.
      console.log(err); // Logs the error to the console.
      callback(err, err.msg); // Calls the callback function with the error object and message.
    } else { // If there was no error in the request:
      console.log(JSON.stringify(body, null, 4)); // Logs the response body to the console in a formatted JSON string.
      callback(null, body); // Calls the callback function with null for the error and the response body.
    }
  });
};

// Exports the translate function to be used in other modules.
module.exports = {
  translate: translate, // Sets the translate property of the exports object to the translate function.
};