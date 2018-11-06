'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var BuildingSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  building_id: String,  
  building_name: [],
  no_of_floors: Number,
  opening_hours: String,
  validity: String,
  country: String,
  city: String,
  tags: [],
  logo: [String],
  info: String,
  longitude: String,
  latitude: String,
  status: Boolean
}, {
  collection: 'buildings',
  timestamps: true
});

export default mongoose.model('Building', BuildingSchema);
