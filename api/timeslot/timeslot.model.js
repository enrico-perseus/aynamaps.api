'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var TimeslotSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },  
    name: {
      type: String,
      default: 'English'
    },
    is_all_day: {
      type: Number,
      default: 1
    },
    sunday: {
      type: Number,
      default: 0
    },
    monday: {
      type: Number,
      default: 0
    },
    tuesday: {
      type: Number,
      default: 0
    },
    wednesday: {
      type: Number,
      default: 0
    },
    thursday: {
      type: Number,
      default: 0
    },
    friday: {
      type: Number,
      default: 0
    },
    saturday: {
      type: Number,
      default: 0
    },
    start_time: {
      type: String,
      default: '00:00 AM'
    },
    end_time: {
      type: String,
      default: '23:59 PM'
    },
    start_date: String,
    end_date: String,
    usage: {
      use_number: Number,
      use_items: []
    }
}, {
  collection: 'timeslots',
  timestamps: true
});

export default mongoose.model('Timeslot', TimeslotSchema);
