'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';

var LanguageSchema = new Schema({
  // main info
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    lowercase: true,
    required: true,
    unique: {
      message: 'The specified language is already in use.'
    }
  },
  direction: {
    type: Boolean
  },
  inspire_me: String,
  search: String,
  easy_access: String,
  destination: String,
  top5: String,
  downloading: String,
  connect: String,
  save_lang: String,
  cancel_lang: String,
  resync: String,
  release_license: String,
  default_view: String,
  smart_mode: String,
  normal_mode: String,
  player_id: String,
  default_language: String,
  lang: String
}, {
  collection: 'languages',
  timestamps: true
});

export default mongoose.model('Language', LanguageSchema);
