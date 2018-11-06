'use strict';

import Beacon from './beacons.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

const async = require('async');
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

export function upload(req, res) {  
  require('crypto').randomBytes(48, function (err, buffer) {
    var uniqueName = buffer.toString('hex').substr(0, 8);

    var newPath = path.resolve('./assets/uploads/' + uniqueName + path.extname(req.files.file.name)),
    relativePath= 'assets/uploads/' + uniqueName + path.extname(req.files.file.name);
    
    let file = req.files.file;
    file.mv(newPath, function (err) {
      if (err) {
        return res.status(500).send(err);
      }

      res.send(relativePath);
    })
  });
}

export function index(req, res) {
  return Beacon.find({}, '-salt -password').exec()
    .then(beacons => {
      res.status(200).json(beacons);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Beacon.find({createdBy: userId}).populate('createdBy').then(function(beacons) {
      res.status(200).send(beacons);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let beaconData = req.body;
  beaconData.createdBy = req.user._id;
  let newBeacon = new Beacon(beaconData);
  console.log(beaconData);

  return Beacon.findOne({beacon_code: { $regex: beaconData.beacon_code, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(beacon => {
      if (beacon != null) {
        return res.status(403).send('The beacon code already existed.');
      }

      return newBeacon.save().then(function(beacon) {
        res.status(200).send(beacon);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
 
export function show(req, res, next) {

  return Beacon.findOne({_id: req.params.id}).exec()
    .then(beacon => {
      if(!beacon) {
        return res.status(404).end();
      }
      res.json(beacon);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  
  async.waterfall([
    function(callback){
      Beacon.findOne({_id: req.body._id}, function(err, beacon){
        if (err){ 
          callback(err);
        } else {
          callback(null, beacon);
          
        }        
      });
    },

    function(beacon, callback){
      Beacon.findOne({beacon_code: {$regex: req.body.beacon_code, $options: 'i'}, createdBy: req.user._id}, function(err, result){
        if (err){ 
          callback(err);
        }
        
        if (result != null && result._id != req.body._id) {
          err = 'The beacon code already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
      });
    },
    
    function(result, callback){
      Beacon.findOneAndUpdate({_id: req.body._id}, req.body, function(err, beacon){
        if (err) callback(err);
        callback(null, beacon);  
      });
    }    
  ], function(err, beacon){
    if (err) return res.status(403).send(err);
    return res.status(200).send(beacon);
  });
 
  /* return Beacon.findOne({beacon_code: { $regex: req.body.beacon_code, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(beacon => {
      if (beacon != null && beacon._id != req.body._id) {
        return res.status(403).send('The beacon name already existed.');
      }

      Beacon.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(beacon => {
            return res.json(beacon);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res)); */
}

export function destroy(req, res) {
  return Beacon.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}