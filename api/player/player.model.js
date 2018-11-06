'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var PlayerSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_id: String,
  building_id: String,
  floor_id: String,
  playerip: String,
  player_code: String,
  player_number: String,
  player_name:[],
  group_id: {
    type: Schema.ObjectId,
    ref: 'Group'
  },
  type: String,
  map_rotate: String,
  orientation: String,
  assistant: Boolean,
  latitude: String,
  longitude: String,  
  status: Boolean,
  tags: []
}, {
  collection: 'players',
  timestamps: true
});

export default mongoose.model('Player', PlayerSchema);
