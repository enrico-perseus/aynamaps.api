'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var UsersInfoSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },  
    name: {
      type: String,
      default: 'English'
    },
    password: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: 'example@example.com'
    },
    logo: {
      type: String,
      default: 'assets/images/user-top.png'
    },
    role: {
      type: String,
      default: 'admin'
    },
    type: {
      type: String,
      default: 'Internal'
    },
    validity: {
      type: String,
      default: '1'
    },
    building : {
      type: String,
      default: 'flat'
    },
    floor: {
      type: String,
      default: '0'
    },
    location: {
      type: String,
      default: ''
    },
    building_full: {
      type: String,
      default: ''
    },
    floor_full: {
      type: String,
      default: ''
    },
    location_full: {
      type: String,
      default: ''
    },
    status: Boolean 
}, {
  collection: 'users_info',
  timestamps: true
});

export default mongoose.model('UsersInfo', UsersInfoSchema);
