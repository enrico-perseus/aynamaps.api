'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var EmergencySchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  emergency_code: String,
  uid: String,
  building_id: String,
  floor_id:String,
  emergency_name: [],
  category: {
    type: Schema.ObjectId,
    ref: 'Category'
  },
  current_status: String,
  parent: String,
  opening_hours: String,
  validity: String,
  logo: [String],
  emergency_icon:[String],
  website: String,
  email: String,
  phone: String,
  info: String,
  longitude: String,
  latitude: String,
  status: Boolean,
  tags: []
}, {
  collection: 'emergencies',
  timestamps: true
});

export default mongoose.model('Emergency', EmergencySchema);
