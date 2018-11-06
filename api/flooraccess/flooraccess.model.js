'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var FloorAccessSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  flooraccess_code: String,  
  building_id: String,
  floor_id_from: [{
    type:Schema.ObjectId,
    ref: 'Floor'
  }],
  floor_id_to: [{
    type:Schema.ObjectId,
    ref: 'Floor'
  }],
  flooraccess_position: [],
  type: String,
  parent: String,
  validity: String,
  longitude: String,
  latitude: String,
  accessibility: String,
  status: Boolean,
  tags: []
}, {
  collection: 'flooraccesses',
  timestamps: true
});

export default mongoose.model('FloorAccess', FloorAccessSchema);
