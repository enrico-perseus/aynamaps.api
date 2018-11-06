'use strict';

import FloorAccess from './flooraccess.model'
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
  return FloorAccess.find({}, '-salt -password').exec()
    .then(floors => {
      res.status(200).json(floors);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return FloorAccess.find({createdBy: userId}).populate('createdBy floor_id_from floor_id_to').then(function(floors) {
      res.status(200).send(floors);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {

  let floorData = req.body;
  floorData.createdBy = req.user._id;
  let newFloorAccess = new FloorAccess(floorData);
  console.log(floorData);
  //createdBy: req.user._id
  return FloorAccess.findOne({flooraccess_code: {$regex: floorData.flooraccess_code, $options: 'i'}, building_id: floorData.building_id , createdBy: req.user._id}).exec()
    .then(floor => {
      if (floor != null) {
        return res.status(403).send('The floor access code already existed.');
      }

      return newFloorAccess.save().then(function(floor) {
        res.status(200).send(floor);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function show(req, res, next) {

  return FloorAccess.findOne({_id: req.params.id}).exec()
    .then(floor => {
      if(!floor) {
        return res.status(404).end();
      }
      res.json(floor);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  async.waterfall([
    function(callback){
      FloorAccess.findOne({_id: req.body._id}, function(err, flooraccess){
        if (err){
          callback(err);
        } else {
          callback(null, flooraccess);

        }
      });
    },

    function(flooraccess, callback){
      FloorAccess.findOne({flooraccess_code: {$regex: req.body.flooraccess_code, $options: 'i'}, building_id: flooraccess.building_id, createdBy: req.user._id}, function(err, result){
        if (err){
          callback(err);
        }

        if (result != null && result._id != req.body._id) {
          err = 'The flooraccess code already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
      });
    },

    function(result, callback){
      FloorAccess.findOneAndUpdate({_id: req.body._id}, req.body, function(err, flooraccess){
        if (err) callback(err);
        callback(null, flooraccess);
      });
    }
  ], function(err, flooraccess){
    if (err) return res.status(403).send(err);
    return res.status(200).send(flooraccess);
  });
}

export function destroy(req, res) {
  return FloorAccess.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}

export function getByBuildingId(req, res){

  var userId = req.user._id;
  var building_id = req.params.building_id;
  return FloorAccess.find({createdBy: userId, building_id: building_id}).then(function(floors) {
    res.status(200).send(floors);
  })
  .catch(validationError(res));
}
