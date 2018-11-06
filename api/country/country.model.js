'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var CountrySchema = new Schema({
  // main info   
    id: {
      type: Number
    },
    contry_code: {
      type: String
    },
    country_name: {
      type: String
    }  
}, {
  collection: 'countries',
  timestamps: true
});

export default mongoose.model('Country', CountrySchema);
