'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var GroupSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_id: String,
  group_name: String,
  usage: [{
    type: Schema.ObjectId,
    ref: 'Player'
  }],
  status: String
}, {
  collection: 'groups',
  timestamps: true
});

export default mongoose.model('Group', GroupSchema);
