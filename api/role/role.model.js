'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var RoleSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },  
    role_name: {
      type: String,
      default: 'English'
    },
    status: Boolean,
    content_management: {
      type: String,
      default: '0,1,1'
    },
    network_management: {
      type: String,
      default: '0,1,1'
    },
    reports: {
      type: String,
      default: '1'
    },
    system_management: {
      type: String,
      default: '0,1,1'
    }
}, {
  collection: 'roles',
  timestamps: true
});

export default mongoose.model('Role', RoleSchema);
