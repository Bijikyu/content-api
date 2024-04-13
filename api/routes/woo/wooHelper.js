// This file/module is responsible for interacting with the WooCommerce REST API to post and get products.

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default; // Require the WooCommerce REST API package.
const path = require('path'); // Require the path module to handle file paths.
const conf = require(path.join(process.env.APPDATA, "clipnuke", "config.json")); // Load the configuration file from the specified path.

// Check if the necessary WooCommerce credentials are provided in the configuration.
if (conf.settings.woocommerce.site_url && conf.settings.woocommerce.consumer_key && conf.settings.woocommerce.consumer_secret) {
  var WooCommerce = new WooCommerceRestApi({ // Initialize the WooCommerce API with the provided credentials.
    url: conf.settings.woocommerce.site_url, // WooCommerce site URL.
    consumerKey: conf.settings.woocommerce.consumer_key, // WooCommerce consumer key.
    consumerSecret: conf.settings.woocommerce.consumer_secret, // WooCommerce consumer secret.
    version: conf.settings.woocommerce.version || "wc/v3", // WooCommerce API version, default to "wc/v3".
    queryStringAuth: conf.settings.woocommerce.query_string_auth || true // Whether to force Basic Authentication as query string true/false, default to true.
  });
}

// Function to post a new product to WooCommerce.
function postProduct(data, callback) {
  data.type = "variable"; // Set the product type to "variable".
  data.status = "draft"; // Set the product status to "draft".
  data.tax_status = "none"; // Set the tax status to "none".
  data.tax_class = "Zero Rate"; // Set the tax class to "Zero Rate".
  data.attributes = []; // Initialize the attributes array.
  data.attributes.push({ // Add a new attribute to the product.
    id: 4, // Attribute ID.
    name: "File Format", // Attribute name.
    variation: true, // Whether this attribute is used for variations.
    options: ["HD 1080p MP4", "3-Day VOD Rental"] // Options for the attribute.
  });
  data.default_attributes = []; // Initialize the default attributes array.
  data.default_attributes.push({ // Add a default attribute to the product.
    id: 4, // Attribute ID.
    name: "File Format", // Attribute name.
    option: "HD 1080p MP4" // Default option for the attribute.
  });
  delete data.id; // Remove the id property from the data object.
  delete data.variations; // Remove the variations property from the data object.
  // delete data.tags; // (Commented out) Remove the tags property from the data object.
  delete data.images; // TEMP. Remove the images property from the data object due to upload error.

  // Function to recursively remove 'id' properties from nested objects.
  function removeMeta(obj) {
    for (prop in obj) { // Iterate over properties in the object.
      if (prop === 'id') // Check if the property is 'id'.
        delete obj[prop]; // Delete the 'id' property.
      else if (typeof obj[prop] === 'object') // Check if the property is an object.
        removeMeta(obj[prop]); // Recursively call removeMeta on the nested object.
    }
  }

  removeMeta(data.tags); // Remove 'id' properties from the tags object.
  removeMeta(data.images); // Remove 'id' properties from the images object.
  removeMeta(data.categories); // Remove 'id' properties from the categories object.

  // (Commented out) Retrieve product categories from WooCommerce.
  // WooCommerce.get("products/categories")
  //   .then((response) => {
  //     console.log(response.data);
  //   })
  //   .catch((error) => {
  //     console.log(error.response.data);
  //   });

  console.log(data); // Log the modified data object to the console.

  // Post the new product to WooCommerce.
  WooCommerce.post("products", data)
    .then((response) => { // Handle the successful response.
      var id = response.data.id; // Store the ID of the created product.
      console.log(response.data); // Log the response data to the console.
      var variation = {}; // Initialize a new variation object.
      variation.regular_price = "1.99"; // Set the regular price for the variation.
      variation.tax_status = "none"; // Set the tax status for the variation.
      variation.tax_class = "Zero Rate"; // Set the tax class for the variation.
      variation.virtual = true; // Set the variation as virtual.
      variation.attributes = []; // Initialize the attributes array for the variation.
      variation.attributes.push({ // Add a new attribute to the variation.
        id: 4, // Attribute ID.
        name: "File Format", // Attribute name.
        option: "3-Day VOD Rental" // Option for the attribute.
      });

      // Create a new variation for the product.
      WooCommerce.post("products/" + id + "/variations", variation)
        .then((response) => { // Handle the successful response for creating a variation.
          console.log(response.data); // Log the response data to the console.
          WooCommerce.post("products", data)
            .then((response) => { // Handle the successful response for posting the product again.
              console.log(response.data); // Log the response data to the console.
              var variation = {}; // Initialize another new variation object.
              variation.tax_status = "none"; // Set the tax status for the variation.
              variation.tax_class = "Zero Rate"; // Set the tax class for the variation.
              variation.virtual = true; // Set the variation as virtual.
              variation.downloadable = true; // Set the variation as downloadable.
              variation.attributes = []; // Initialize the attributes array for the variation.
              variation.attributes.push({ // Add a new attribute to the variation.
                id: 4, // Attribute ID.
                name: "File Format", // Attribute name.
                option: "HD 1080p MP4" // Option for the attribute.
              });

              // Create another new variation for the product.
              WooCommerce.post("products/" + id + "/variations", variation)
                .then((response) => { // Handle the successful response for creating another variation.
                  console.log(response.data); // Log the response data to the console.
                })
                .catch((error) => { // Handle errors for creating the variation.
                  console.log(error.response.data); // Log the error response data to the console.
                });

              // (Commented out) Callback to return the response data.
              // callback(null, response.data);
            })
            .catch((error) => { // Handle errors for posting the product.
              console.log(error.response.data); // Log the error response data to the console.
            });
        })
        .catch((error) => { // Handle errors for creating the first variation.
          console.log(error.response.data); // Log the error response data to the console.
        });

      // (Commented out) Callback to return the response data.
      // callback(null, response.data);
    })
    .catch((error) => { // Handle errors for posting the new product.
      console.log(error.response.data); // Log the error response data to the console.
      var msg = {}; // Initialize a new message object.
      msg.id = error.response.data.data.resource_id; // Set the resource ID in the message object.
      msg.code = error.response.data.code; // Set the error code in the message object.
      msg.msg = error.response.data.message; // Set the error message in the message object.
      callback(error.message, msg); // Execute the callback with the error message and the message object.
    });

}

// Function to retrieve a product from WooCommerce by ID.
function getProduct(id, callback) {
  WooCommerce.get("products/" + id) // Send a GET request to retrieve the product.
    .then((response) => { // Handle the successful response.
      console.log(response.data); // Log the response data to the console.
      callback(null, response.data); // Execute the callback with the response data.
    })
    .catch((error) => { // Handle errors for retrieving the product.
      console.log(error.response.data); // Log the error response data to the console.
      callback(error, error.response.data); // Execute the callback with the error and the error response data.
    });
}

module.exports = { // Export the postProduct and getProduct functions.
  postProduct, // Export the postProduct function.
  getProduct // Export the getProduct function.
};