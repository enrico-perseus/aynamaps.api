'use strict';

import NASetting from './notification_alert_setting.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

var path = require('path');

function validationError(res, statusCode) {
  console.log("error = " + res);
  statusCode = statusCode || 422;
  return function(err) {
    return res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    return res.status(statusCode).send(err);
  };
}

export function index(req, res) {
  return NASetting.find({}, '-salt -password').exec()
    .then(nASettings => {
      res.status(200).json(nASettings);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return NASetting.find({createdBy: userId}).populate('createdBy').then(function(nASettings) {
      res.status(200).send(nASettings);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let nASettingData = req.body;
  nASettingData.createdBy = req.user._id;
  let newNASetting = new NASetting(nASettingData);
  console.log(nASettingData);

  return NASetting.findOne({createdBy: req.user._id}).exec()
    .then(nASettingData => {            
      
      if (nASettingData != null) {
        return res.status(403).send('The nASetting already existed.');
      }

      return newNASetting.save().then(function(nASetting) {
        res.status(200).send(nASetting);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
 
/* export function show(req, res) {
  console.log("req=============="+ req.user._id);
  var userId = req.user._id;
    return NASetting.findOne({createdBy: userId}).exec()
    .then(nASetting => {      
      res.json(nASetting);
    })
    .catch(validationError(res));
} */

export function show(req, res, next) {
  console.log("req=============="+ req.user._id);
  return NASetting.findOne({createdBy: req.user._id}).exec()
    .then(nASetting => {
      if(!nASetting) {
        console.log("error=============="+ req.user._id);
        return res.status(404).end();
      }
      console.log("req=============="+ nASetting);
      res.status(200).json(nASetting);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  return NASetting.findOne({createdBy: req.user._id}).exec()
    .then(nASetting => {
      if (nASetting != null && nASetting._id != req.body._id) {
        return res.status(403).send('The nASetting already existed.');
      }

      NASetting.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(nASetting => {
            return res.json(nASetting);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function destroy(req, res) {
  return NASetting.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}