'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var CustomerSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: {
      message: 'The specified email address is already in use.'
    }
  },
  role: {
    type: String,
    default: 'user'
  },
  password: {
    type: String,
    required: true
  },
  salt: String,
  avatar: {
    type: String,
    default: 'assets/uploads/default_profile.png'
  },
  account_name: {
    type: String,
    required: true,
    unique: {
      message: 'The specified account named is already in use.'
    }
    
  },
  account_type: String,
  license_type: String,
  subscription_type: String,
  kiosk_value: Number,
  is_kiosk_unlimited: {
    type: Boolean,
    default: false
  },
  destination_value: Number,
  is_destination_unlimited: {
    type: Boolean,
    default: false
  },
  building_value: Number,
  is_building_unlimited: {
    type: Boolean,
    default: false
  },
  user_value: Number,
  is_user_unlimited: {
    type: Boolean,
    default: false
  },
  subscription_start_date: Date,
  subscription_end_date: Date,
  sla_level: String,
  language: [{
    type: Schema.ObjectId,
    ref: 'Language'
  }],
  //language: [String], 
  status: {
    type: Boolean,
    default: false
  },
  tour_3d: {
    type: Boolean,
    default: false
  },
  validity_start_date: Date,
  validity_end_date: Date,
  customer_images: [String],
  // other info
  user_type: String,
  phone_number: String,
  po_box: String,
  company_address: String,
  fax: String,
  validity: Number,
  building: String,
  logo: String,
  floor: String,
  location: String,
  building_full: Number,
  floor_full: Number,
  location_full: Number,
  temp_pass_token: String,

  // other settings
  system_settings: {
    systemLanguage: {
      type: String,
      default: 'English'
    },
    autoSyncIntervals: {
      type: String,
      default: 'Daily'
    },
    serverTimezone: {
      type: String,
      default: '14'
    },
    sessionTimeout: {
      type: String,
      default: '2 minutes'
    }
  },
  time_slots: {
    name: {
      type: String,
      default: 'English'
    },
    is_all_day: {
      type: Number,
      default: 1
    },
    sunday: {
      type: Number,
      default: 0
    },
    monday: {
      type: Number,
      default: 0
    },
    tuesday: {
      type: Number,
      default: 0
    },
    wednesday: {
      type: Number,
      default: 0
    },
    thursday: {
      type: Number,
      default: 0
    },
    friday: {
      type: Number,
      default: 0
    },
    saturday: {
      type: Number,
      default: 0
    },
    start_time: {
      type: String,
      default: '00:00 AM'
    },
    end_time: {
      type: String,
      default: '23:59 PM'
    },
    start_date: String,
    end_date: String
  },
}, {
  collection: 'customers',
  timestamps: true
});

/**
 * Virtuals
 */

// Public profile information
CustomerSchema
  .virtual('profile')
  .get(function() {
    return {
      _id: this._id,
      name: this.name,
      user_type: this.user_type,
      role: this.role,
      status: this.status,
      subscription_start_date: this.subscription_start_date,
      subscription_end_date: this.subscription_end_date,      
      email: this.email,
      logo: this.logo,
      language: this.language,
      avatar: this.avatar,
      kiosk_value: this.kiosk_value,
      is_kiosk_unlimited: this.is_kiosk_unlimited,
      destination_value: this.destination_value,
      is_destination_unlimited: this.is_destination_unlimited,
      building_value: this.building_value,
      is_building_unlimited: this.is_building_unlimited,
      user_value: this.user_value,
      is_user_unlimited: this.is_user_unlimited
    };
  });

// Non-sensitive info we'll be putting in the token
CustomerSchema
  .virtual('token')
  .get(function() {
    return {
      _id: this._id,
      role: this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
CustomerSchema
  .path('email')
  .validate(function(email) {
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
CustomerSchema
  .path('password')
  .validate(function(password) {
    return password.length;
  }, 'Password cannot be blank');

// Validate email is not taken
/*
CustomerSchema
  .path('email')
  .validate(function(value, respond) {
    return this.constructor.findOne({ email: value }).exec()
      .then(user => {
        if(user) {
          if(this.id === user.id) {
            return respond(true);
          }
          return respond(false);
        }
        return respond(true);
      })
      .catch(function(err) {
        throw err;
      });
  }, 'The specified email address is already in use.');
*/

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
CustomerSchema
  .pre('save', function(next) {
    // Handle new/update passwords
    if(!this.isModified('password')) {
      return next();
    }

    if(!validatePresenceOf(this.password)) {
      return next(new Error('Invalid password'));
    }

    // Make salt with a callback
    this.makeSalt((saltErr, salt) => {
      if(saltErr) {
        return next(saltErr);
      }
      this.salt = salt;
      this.encryptPassword(this.password, (encryptErr, hashedPassword) => {
        if(encryptErr) {
          return next(encryptErr);
        }
        this.password = hashedPassword;
        return next();
      });
    });
  });

/**
 * Methods
 */
CustomerSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} password
   * @param {Function} callback
   * @return {Boolean}
   * @api public
   */
  authenticate(password, callback) {
    if(!callback) {
      return this.password === this.encryptPassword(password);
    }

    this.encryptPassword(password, (err, pwdGen) => {
      if(err) {
        return callback(err);
      }

      if(this.password === pwdGen) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    });
  },

  /**
   * Make salt
   *
   * @param {Number} [byteSize] - Optional salt byte size, default to 16
   * @param {Function} callback
   * @return {String}
   * @api public
   */
  makeSalt(...args) {
    var defaultByteSize = 16;
    let byteSize;
    let callback;

    if(typeof args[0] === 'function') {
      callback = args[0];
      byteSize = defaultByteSize;
    } else if(typeof args[1] === 'function') {
      callback = args[1];
    } else {
      throw new Error('Missing Callback');
    }

    if(!byteSize) {
      byteSize = defaultByteSize;
    }

    return crypto.randomBytes(byteSize, (err, salt) => {
      if(err) {
        return callback(err);
      } else {
        return callback(null, salt.toString('base64'));
      }
    });
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @param {Function} callback
   * @return {String}
   * @api public
   */
  encryptPassword(password, callback) {
    if(!password || !this.salt) {
      if(!callback) {
        return null;
      } else {
        return callback('Missing password or salt');
      }
    }

    var defaultIterations = 10000;
    var defaultKeyLength = 64;
    var salt = new Buffer(this.salt, 'base64');

    if(!callback) {
      return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, 'sha256')
        .toString('base64');
    }

    return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, 'sha256', (err, key) => {
      if(err) {
        return callback(err);
      } else {
        return callback(null, key.toString('base64'));
      }
    });
  }
};

export default mongoose.model('Customer', CustomerSchema);
