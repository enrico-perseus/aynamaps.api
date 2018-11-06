'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var AynaRouteSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  floor_id:String,
  pixel_map: []

}, {
  collection: 'aynaroute',
  timestamps: true
});

export default mongoose.model('AynaRoute', AynaRouteSchema);
