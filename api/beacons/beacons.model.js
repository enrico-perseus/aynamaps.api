'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var BeaconSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  beacon_code: String,
  uid: String,
  building_id: String,
  floor_id:String,
  type: String,
  brand: String,
  mac: String,
  status: Boolean,
  longitude: String,
  latitude: String,
  tags: []
}, {
  collection: 'beacons',
  timestamps: true
});

export default mongoose.model('Beacon', BeaconSchema);
