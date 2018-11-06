'use strict';
/*eslint no-process-env:0*/

import path from 'path';
import _ from 'lodash';

/*function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}*/

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

    // Root path of server
  root: path.normalize(`${__dirname}/../../..`),

    // dev client port
  clientPort: process.env.CLIENT_PORT || 3000,

    // Server port
  port: process.env.PORT || 80,

    // Server IP
  ip: process.env.IP || '0.0.0.0',

    // Should we populate the DB with sample data?
  seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'aynasecurity20180225',
    expiredIn: 60 * 60 * 5
  },

    // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

    // Profile Image upload options
  uploads: {
    profileUpload: {
      dest: './public/uploads/', // Profile upload destination path
      limits: {
        fileSize: 50*1024*1024 // Max file size in bytes (50 MB)
      }
    }
  },
  profileUploadFileFilter: function (req, file, cb) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },

  // Mailer option
  mailOption: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  },
  adminMailAddress: 'info@aynamaps.com',
  siteUrl: 'http://aynamaps.com/'
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./shared').default,
    require(`./${process.env.NODE_ENV}.js`) || {});
