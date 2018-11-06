'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var PoiSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  poi_number: String,
  tags: [],
  building_id: String,
  floor_id:String,
  poi_name: [],
  category: {
    type: Schema.ObjectId,
    ref: 'Category'
  },
  current_status: String,
  parent: String,
  opening_hours: String,
  validity: String,
  logo: [String],
  poi_icon:[String],
  website: String,
  email: String,
  phone: String,
  info: String,
  longitude: String,
  latitude: String,
  status: Boolean
}, {
  collection: 'pois',
  timestamps: true
});

export default mongoose.model('Poi', PoiSchema);
