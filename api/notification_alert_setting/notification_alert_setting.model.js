'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var NASettingSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  kioskStatus: Boolean,
  kioskEmail: []  
}, {
  collection: 'notification_alert_settings',
  timestamps: true
});

export default mongoose.model('NASetting', NASettingSchema);
