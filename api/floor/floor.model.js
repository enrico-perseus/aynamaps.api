'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var FloorSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  short_name: String,
  long_name: [],
  floor_position: String,
  opening_hours: String,
  validity: String,
  tags: [],
  logo: [String],
  info: String,
  map: [String],
  longitude: String,
  latitude: String,
  status: Boolean,
  building_id: String,
  color1: String,
  color2: String,
  pixmap: [String]
}, {
  collection: 'floors',
  timestamps: true
});

export default mongoose.model('Floor', FloorSchema);
