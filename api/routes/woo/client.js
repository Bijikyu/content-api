// This file sets up the WooCommerce API client for interacting with a WooCommerce store.

'use strict'; // Enables strict mode which helps catch common coding mistakes and "unsafe" actions.

const WooCommerceAPI = require('woocommerce-api'); // Requires the WooCommerce API npm package.

// Setup WooCommerce client
var WooCommerce = new WooCommerceAPI({
  url: process.env.WP_BASE_URL, // The base URL of the WordPress site.
  consumerKey: process.env.WC_CONSUMER_KEY, // Consumer key for WooCommerce API authentication.
  consumerSecret: process.env.WC_CONSUMER_SECRET, // Consumer secret for WooCommerce API authentication.
  wpAPI: true, // Indicates that the new WP REST API integration is being used.
  version: 'wc/v2' // Specifies the WooCommerce API version to be used.
});

module.exports = {
  WooCommerce: WooCommerce // Exports the WooCommerce client for use in other parts of the application.
};