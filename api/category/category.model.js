'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var CategorySchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_id: String,
  name: String,
  status: String,
  usage: {
    use_number: Number,
    use_item: []
  }
}, {
  collection: 'categories',
  timestamps: true
});

export default mongoose.model('Category', CategorySchema);
