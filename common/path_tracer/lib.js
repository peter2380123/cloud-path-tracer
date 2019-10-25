"use strict";
const bindings = require('./bindings');
const de = require('./deserialise');

// Export all our native bindings.
module.exports = bindings;

// Also export JSON validation function and the building function:
module.exports["JSON"] = module.exports["JSON"] || {};
module.exports["JSON"] = { 
  checkValid: de.isValidSceneAndCamera,
  parseValid: de.buildSceneAndCameraFromValidDescription,
};


