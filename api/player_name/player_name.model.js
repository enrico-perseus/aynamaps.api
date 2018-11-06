'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var PlayerNameSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  player_id: {
    type: Schema.ObjectId,
    ref: 'Player'
  },
  name: String,
  value: String,    
  status: Boolean,
}, {
  collection: 'players_name',
  timestamps: true
});

export default mongoose.model('PlayerName', PlayerNameSchema);
