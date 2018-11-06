'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {
    // MongoDB connection options
  mongo: {
    //uri: 'mongodb://localhost/aynamongo-dev'
    uri: 'mongodb://localhost:27017/aynamongo-dev'
    // uri: 'mongodb://localhost:27084/escademean-dev'
  },

    // Seed database on startup
  seedDB: true
};
